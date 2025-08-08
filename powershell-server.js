import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./')); // Servir arquivos estáticos do diretório atual

// Função para executar comando PowerShell
function executarPowerShell(comando) {
  return new Promise((resolve, reject) => {
    // Escapar aspas duplas no comando
    const comandoEscapado = comando.replace(/"/g, '\"');
    
    // Executar comando PowerShell
    const comandoCompleto = `powershell.exe -Command "${comandoEscapado}"`;
    
    console.log(`Executando: ${comandoCompleto}`);
    
    exec(comandoCompleto, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar comando: ${error.message}`);
        reject({
          success: false,
          error: error.message,
          comando: comando
        });
        return;
      }
      
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      
      console.log(`✅ Comando executado com sucesso: ${comando}`);
      console.log(`Saída: ${stdout}`);
      
      resolve({
        success: true,
        output: stdout,
        comando: comando
      });
    });
  });
}

// Endpoint para executar comandos PowerShell
app.post('/execute-powershell', async (req, res) => {
  try {
    const { commands } = req.body;
    
    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        error: 'Array de comandos é obrigatório'
      });
    }
    
    console.log(`📥 Recebidos ${commands.length} comandos para execução`);
    
    const resultados = [];
    let sucessos = 0;
    let erros = 0;
    
    // Executar comandos sequencialmente
    for (let i = 0; i < commands.length; i++) {
      const comando = commands[i];
      console.log(`\n🔄 Executando comando ${i + 1}/${commands.length}: ${comando}`);
      
      try {
        const resultado = await executarPowerShell(comando);
        resultados.push(resultado);
        sucessos++;
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      } catch (error) {
        resultados.push(error);
        erros++;
        console.error(`❌ Erro no comando ${i + 1}: ${error.error}`);
      }
    }
    
    const mensagemFinal = `Execução concluída: ${sucessos} sucessos, ${erros} erros`;
    console.log(`\n🎉 ${mensagemFinal}`);
    
    res.json({
      success: true,
      message: mensagemFinal,
      results: resultados,
      summary: {
        total: commands.length,
        sucessos,
        erros
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para criar pastas usando o script Node.js
app.post('/create-folders', async (req, res) => {
  try {
    console.log('🔄 Iniciando criação de pastas...');
    
    const comando = 'cd "bot_functions"; node create_folder.js';
    
    const resultado = await executarPowerShell(comando);
    
    if (resultado.success) {
      console.log('✅ Criação de pastas concluída com sucesso');
      res.json({
        success: true,
        message: 'Pastas criadas com sucesso!',
        output: resultado.output,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(resultado.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na criação de pastas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor PowerShell funcionando',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor PowerShell rodando em http://localhost:' + PORT);
  console.log('📁 Pronto para executar comandos de criação de pastas!');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});