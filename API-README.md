# 🤖 Monday Automation Server - Documentação da API

## 📋 Visão Geral

A **Monday Automation Server API** é um sistema completo de monitoramento automático do Monday.com que detecta itens com status "BOT" e etapa "Contato Inicial" para processar automaticamente a criação de pastas.

## 🚀 Acesso Rápido

### 📖 Documentação Interativa (Swagger UI)
```
http://localhost:3001/docs
```

### 📄 Especificação da API (YAML)
```
http://localhost:3001/api-docs
```

### ℹ️ Informações da API
```
http://localhost:3001/api/info
```

### 📊 Status do Sistema
```
http://localhost:3001/status
```

## 🛠️ Como Iniciar

### Método 1: Desenvolvimento
```bash
npm start
```

### Método 2: Produção com PM2
```bash
# Deploy completo
npm run pm2:deploy

# Ou passo a passo
npm run pm2:install  # Instalar PM2
npm run pm2:start    # Iniciar aplicação
npm run pm2:status   # Verificar status
```

## 📚 Endpoints Principais

### 🔍 Monitoramento
| Endpoint | Método | Descrição |
|----------|--------|----------|
| `/monitoring/start` | POST | Iniciar monitoramento automático |
| `/monitoring/stop` | POST | Parar monitoramento |
| `/monitoring/check` | POST | Verificação manual imediata |
| `/monitoring/reset-stats` | POST | Resetar estatísticas |

### 📁 Criação de Pastas
| Endpoint | Método | Descrição |
|----------|--------|----------|
| `/create-folders` | POST | Criar pastas manualmente |

### 📊 Status e Informações
| Endpoint | Método | Descrição |
|----------|--------|----------|
| `/status` | GET | Status completo do sistema |
| `/api/info` | GET | Informações da API |
| `/docs` | GET | Documentação Swagger UI |
| `/api-docs` | GET | Especificação YAML |

### 🛠️ Utilitários
| Endpoint | Método | Descrição |
|----------|--------|----------|
| `/execute-powershell` | POST | Executar comandos PowerShell |

## 🔧 Exemplos de Uso

### Verificar Status do Sistema
```bash
curl http://localhost:3001/status
```

### Iniciar Monitoramento
```bash
curl -X POST http://localhost:3001/monitoring/start
```

### Verificação Manual
```bash
curl -X POST http://localhost:3001/monitoring/check
```

### Criar Pastas Manualmente
```bash
curl -X POST http://localhost:3001/create-folders
```

### Executar Comando PowerShell
```bash
curl -X POST http://localhost:3001/execute-powershell \
  -H "Content-Type: application/json" \
  -d '{"commands": ["Get-Date", "Get-Location"]}'
```

## 📊 Estrutura de Resposta

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "error": "Descrição do erro",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

### Status do Sistema
```json
{
  "server": {
    "status": "online",
    "message": "Servidor PowerShell funcionando",
    "timestamp": "2025-01-09T10:30:00.000Z"
  },
  "monitoring": {
    "enabled": true,
    "isRunning": true,
    "interval": 30000,
    "lastCheck": "2025-01-09T10:29:45.000Z",
    "stats": {
      "totalChecks": 150,
      "itemsFound": 25,
      "itemsProcessed": 23,
      "errors": 2
    },
    "processedItems": ["9780413980", "9780413981"]
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# API Monday.com
MONDAY_API_TOKEN=seu_token_aqui
MONDAY_BOARD_ID=9653232918

# Monitoramento
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
STATUS_COLUMN_ID=status_1
ETAPA_COLUMN_ID=status35
TARGET_STATUS=BOT
TARGET_ETAPA=Contato Inicial

# Servidor
PORT=3001
NODE_ENV=production
```

## 🐛 Troubleshooting

### Servidor não responde
1. Verificar se está rodando: `pm2 status`
2. Ver logs: `pm2 logs monday-automation-server`
3. Reiniciar: `pm2 restart monday-automation-server`

### Erro HTTP 403
- Verificar token da API Monday.com no arquivo `.env`
- Confirmar permissões do token no Monday.com

### Monitoramento não funciona
1. Verificar configurações no `.env`
2. Testar manualmente: `POST /monitoring/check`
3. Ver logs detalhados: `pm2 logs --lines 100`

## 📱 Integração Frontend

### JavaScript/Fetch
```javascript
// Verificar status
const status = await fetch('http://localhost:3001/status')
  .then(res => res.json());

// Iniciar monitoramento
const result = await fetch('http://localhost:3001/monitoring/start', {
  method: 'POST'
}).then(res => res.json());
```

### React/Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

// Verificar status
const { data } = await api.get('/status');

// Criar pastas
const result = await api.post('/create-folders');
```

## 🔒 Segurança

### Recomendações:
1. **HTTPS em produção** - Configure certificado SSL
2. **Firewall** - Restrinja acesso à porta 3001
3. **Tokens** - Não commite tokens no código
4. **Logs** - Monitore logs regularmente
5. **Backup** - Faça backup das configurações

## 📈 Monitoramento

### Métricas Disponíveis
- **totalChecks**: Total de verificações realizadas
- **itemsFound**: Itens encontrados no Monday.com
- **itemsProcessed**: Itens processados com sucesso
- **errors**: Erros ocorridos
- **processedItems**: Lista de IDs processados

### Logs
```bash
# Ver logs em tempo real
pm2 logs monday-automation-server

# Logs específicos
pm2 logs monday-automation-server --err  # Apenas erros
pm2 logs monday-automation-server --out  # Apenas saída
```

## 🚀 Deploy

### Desenvolvimento
```bash
git clone <repo>
cd automation_monday-dese
npm install
cp .env.example .env  # Configure as variáveis
npm start
```

### Produção
```bash
# Deploy completo com PM2
npm run pm2:deploy

# Configurar startup automático
npm run pm2:startup
```

## 📞 Suporte

- **Documentação PM2**: [PM2-README.md](./PM2-README.md)
- **Swagger UI**: http://localhost:3001/docs
- **Logs**: `pm2 logs monday-automation-server`
- **Status**: http://localhost:3001/status

---

**🤖 Monday Automation Server - Automatizando o Monday.com com inteligência!**