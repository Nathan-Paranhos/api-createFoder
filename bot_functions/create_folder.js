// monday_automation_refactor.js — Versão 3.2.2 (08‑Aug‑2025)
// Sistema de Automação Monday.com – cria pasta, copia modelo, notifica board e menciona responsáveis.
// 👉 Completo e autossuficiente (ESM). Execute com:  node bot_functions/create_folder.js

/* -------------------------------------------------------------------------- */
/* Dependências                                                               */
/* -------------------------------------------------------------------------- */
import 'dotenv/config';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import winston from 'winston';
import 'dotenv/config';
import { API_CONFIG, makeAPIRequest } from '../config.js';

/* -------------------------------------------------------------------------- */
/* Logger                                                                     */
/* -------------------------------------------------------------------------- */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'monday-automation' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
const expandUser = (p) => p.replace(/%USERNAME%/g, process.env.USERNAME || process.env.USER || 'DEFAULT');
const normPath   = (...segs) => path.normalize(path.join(...segs));

const fetchWithTimeout = async (url, opts = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...opts, signal: controller.signal }); }
  finally { clearTimeout(id); }
};

/* Mapeamento de responsáveis por produto – suporta múltiplos emails */
const responsaveisMap = {
  formula:   (process.env.RESPONSAVEL_FORMULA_CERTA || '').split(',').map(e => e.trim()).filter(Boolean),
  phusion:   (process.env.RESPONSAVEL_PHUSION        || '').split(',').map(e => e.trim()).filter(Boolean),
  geral:     (process.env.RESPONSAVEL_GERAL          || '').split(',').map(e => e.trim()).filter(Boolean)
};

const getResponsaveis = (produto) => {
  if (/f[oô]rmula certa/.test(produto)) return responsaveisMap.formula;
  if (/phusion/.test(produto))           return responsaveisMap.phusion;
  return responsaveisMap.geral;
};

/* -------------------------------------------------------------------------- */
/* Classe principal                                                           */
/* -------------------------------------------------------------------------- */
export class MondayAutomation {
  // Função para executar comandos via API externa
   async executarComandoAPI(endpoint, data) {
     try {
       logger.info('Executando comando via API', { endpoint, data });
       
       const result = await makeAPIRequest(endpoint, data, 'POST');
       
       logger.info('Comando API executado com sucesso', { 
         endpoint,
         resultado: result 
       });
       
       return result;
     } catch (error) {
       logger.error('Erro ao executar comando API', { 
         erro: error.message, 
         endpoint 
       });
       throw error;
     }
   }
  constructor ({ boardId = process.env.MONDAY_BOARD_ID, token = process.env.MONDAY_API_TOKEN } = {}) {
    if (!token || !boardId) throw new Error('MONDAY_API_TOKEN e MONDAY_BOARD_ID são obrigatórios');
    this.token   = token;
    this.boardId = boardId;
    this.apiUrl  = 'https://api.monday.com/v2';

    this.maxRetries   = Number(process.env.MAX_RETRIES   || 3);
    this.retryDelayMs = Number(process.env.RETRY_DELAY   || 1000);
    this.apiTimeoutMs = Number(process.env.API_TIMEOUT   || 30000);

    this.modelFile    = expandUser(process.env.MODEL_FILE_PATH);
    this.baseUserPath = expandUser(process.env.BASE_USER_PATH);
    this.formulaPath  = expandUser(process.env.FORMULA_CERTA_PATH);
    this.phusionPath  = expandUser(process.env.PHUSION_PATH);

    if (!fsSync.existsSync(this.modelFile)) {
      logger.warn('Arquivo VSDX modelo não encontrado', { modelFile: this.modelFile });
    }

    logger.info('MondayAutomation inicializado', { boardId: this.boardId });
  }

  /* ------------------------------- GraphQL -------------------------------- */
  async graphQL (query, variables = {}) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await fetchWithTimeout(this.apiUrl, {
          method : 'POST',
          headers: {
            'Content-Type' : 'application/json',
            Authorization   : `Bearer ${this.token}`,
            'API-Version'   : '2024-01'
          },
          body   : JSON.stringify({ query, variables })
        }, this.apiTimeoutMs);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.errors) throw new Error(JSON.stringify(data.errors));
        return data.data;
      } catch (err) {
        logger.warn(`GraphQL tentativa ${attempt} falhou: ${err.message}`);
        if (attempt === this.maxRetries) throw err;
        await new Promise(r => setTimeout(r, this.retryDelayMs));
      }
    }
  }

  /* ------------------------ Leitura de itens do board --------------------- */
  async obterItensNaFilaBot () {
    const query = `query LIST { boards(ids: [${this.boardId}]) { items_page(limit: 500) { items { id name column_values(ids: ["status_1","status_135","status_15"]) { id text value } } } } }`;
    const data  = await this.graphQL(query);
    const items = data?.boards?.[0]?.items_page?.items || [];

    const colText = (item, id) => {
      const col = item.column_values.find(c => c.id === id);
      return col?.text ?? (col?.value ? JSON.parse(col.value).text : null);
    };

    return items.filter(i => {
      const produto = (colText(i, 'status_1') || '').toLowerCase();
      const status  = colText(i, 'status_135');
      return produto === 'bot' && status === 'Na Fila';
    }).map(i => ({
      id: i.id,
      codigo: i.name.split(' - ')[0] || i.id,
      produtoPrincipal: (colText(i, 'status_15') || 'geral').toLowerCase()
    }));
  }

  /* ------------------------- Criação de pasta ----------------------------- */
  async criarPastaCliente (codigo, produtoPrincipal) {
    console.log(`🔍 Produto Principal detectado: "${produtoPrincipal}"`);
    
    // Lógica corrigida: Fórmula Certa -> FCERTA EXTENSÃO, Phusion -> PHUSION EXTENSÃO
    let base;
    
    // Regex mais abrangente para capturar todas as variações de "fórmula certa"
    const isFormulaCerta = /f[óoô]rmula\s*certa/i.test(produtoPrincipal) || 
                          /formula\s*certa/i.test(produtoPrincipal) ||
                          produtoPrincipal.toLowerCase().includes('formula certa') ||
                          produtoPrincipal.toLowerCase().includes('fórmula certa');
    
    const isPhusion = /phusion/i.test(produtoPrincipal) || 
                     produtoPrincipal.toLowerCase().includes('phusion');
    
    console.log(`🧪 Teste Formula Certa: ${isFormulaCerta}`);
    console.log(`🧪 Teste Phusion: ${isPhusion}`);
    
    if (isFormulaCerta) {
      base = this.formulaPath; // FCERTA EXTENSÃO
      console.log(`📁 ✅ Usando caminho FCERTA EXTENSÃO: ${base}`);
    } else if (isPhusion) {
      base = this.phusionPath; // PHUSION EXTENSÃO
      console.log(`📁 ✅ Usando caminho PHUSION EXTENSÃO: ${base}`);
    } else {
      base = this.phusionPath; // Padrão para casos não mapeados
      console.log(`📁 ⚠️ Usando caminho padrão PHUSION EXTENSÃO: ${base}`);
    }
    
    const pasta = normPath(base, codigo);
    console.log(`📂 Criando pasta: ${pasta}`);
    
    // Criar pasta usando API externa
      try {
        await this.executarComandoAPI(API_CONFIG.ENDPOINTS.CREATE_FOLDER, {
          folderPath: pasta
        });
        console.log(`✅ Pasta criada via API: ${pasta}`);
      } catch (apiError) {
        // Fallback para criação local se API falhar
        logger.warn('API falhou, usando criação local', { erro: apiError.message });
        await fs.mkdir(pasta, { recursive: true });
        console.log(`✅ Pasta criada localmente: ${pasta}`);
      }
    
    try {
      if (fsSync.existsSync(this.modelFile)) {
        const destino = normPath(pasta, path.basename(this.modelFile));
        
        // Tentar copiar via API externa
         try {
           await this.executarComandoAPI(API_CONFIG.ENDPOINTS.COPY_FILE, {
             source: this.modelFile,
             destination: destino
           });
           logger.info('Modelo copiado via API com sucesso', { origem: this.modelFile, destino });
           console.log(`📄 Modelo copiado via API para: ${pasta}`);
         } catch (apiError) {
           // Fallback para cópia local se API falhar
           logger.warn('API de cópia falhou, usando cópia local', { erro: apiError.message });
           await fs.copyFile(this.modelFile, destino);
           logger.info('Modelo copiado localmente com sucesso', { origem: this.modelFile, destino });
           console.log(`📄 Modelo copiado localmente para: ${pasta}`);
         }
      }
    } catch (err) {
      logger.warn('Falha ao copiar modelo', { pasta, err: err.message });
    }
    return pasta;
  }

  /* ----------------------------- Notificação ------------------------------ */
  async notificar (itemId, body) {
    const mutation = `mutation UPDATE { create_update(item_id: ${itemId}, body: "${body}") { id } }`;
    await this.graphQL(mutation);
  }

  /* --------------------------- Orquestração ------------------------------- */
  async processarFila () {
    const itens = await this.obterItensNaFilaBot();
    if (!itens.length) {
      logger.info('Nenhum item BOT "Na Fila"');
      return { ok: true, msg: 'Nenhum item BOT "Na Fila"' };
    }

    const resultados = [];

    for (const it of itens) {
      try {
        console.log(`Processando item ${it.id}: ${it.codigo} - ${it.produtoPrincipal}`);
        const pasta = await this.criarPastaCliente(it.codigo, it.produtoPrincipal);
        const respEmails = getResponsaveis(it.produtoPrincipal);
        const mention    = respEmails.length ? `@${respEmails.join(' @')}` : '*Responsável não mapeado*';
        
        console.log(`Pasta criada: ${pasta}`);
        console.log(`Responsáveis: ${respEmails.join(', ')}`);

        try {
          await this.notificar(it.id, `✅ Pasta criada: ${path.basename(pasta)}\n${mention}`);
          console.log(`Notificação enviada para item ${it.id}`);
        } catch (notifyErr) {
          console.log(`Erro na notificação: ${notifyErr.message}`);
          logger.warn('Falha na notificação', { itemId: it.id, err: notifyErr.message });
        }
        
        resultados.push({ itemId: it.id, status: 'processado', pasta, responsaveis: respEmails });
      } catch (err) {
        console.log(`Erro no item ${it.id}: ${err.message}`);
        logger.error('Falha no item', { itemId: it.id, err: err.message });
        try {
          await this.notificar(it.id, `❌ Erro ao criar pasta: ${err.message}`);
        } catch (notifyErr) {
          logger.warn('Falha na notificação de erro', { itemId: it.id, err: notifyErr.message });
        }
        resultados.push({ itemId: it.id, status: 'erro', erro: err.message });
      }
    }

    const ok = resultados.filter(r => r.status === 'processado').length;
    return { ok: true, msg: `${ok}/${resultados.length} itens processados`, resultados };
  }
}

/* -------------------------------------------------------------------------- */
/* Executável via CLI                                                         */
/* -------------------------------------------------------------------------- */
// Executa quando chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('create_folder.js')) {
  console.log('🚀 Iniciando execução do script create_folder.js');
  (async () => {
    try {
      console.log('📋 Criando instância MondayAutomation...');
      const automation = new MondayAutomation();
      console.log('⚡ Processando fila...');
      const res = await automation.processarFila();
      console.log('✅ Processamento concluído:', res);
      logger.info('Concluído', res);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erro durante execução:', err.message);
      logger.error('Execução encerrada com erro', { err: err.message });
      process.exit(1);
    }
  })();
}

// Export default para importação simples
export default MondayAutomation;
