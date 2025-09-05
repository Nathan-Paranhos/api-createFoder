# 🚀 Monday Automation Server - Configuração PM2

## 📋 Visão Geral

Este projeto utiliza PM2 para gerenciar o servidor de monitoramento automático do Monday.com em produção. O PM2 oferece:

- ✅ **Restart automático** em caso de falhas
- ✅ **Monitoramento em tempo real**
- ✅ **Logs centralizados**
- ✅ **Zero downtime deployments**
- ✅ **Startup automático** no boot do sistema
- ✅ **Clustering** (se necessário)

## 🛠️ Instalação e Configuração

### 1. Instalar PM2 globalmente
```bash
npm run pm2:install
# ou
npm install -g pm2
```

### 2. Instalar dependências do projeto
```bash
npm install
```

### 3. Deploy inicial
```bash
npm run pm2:deploy
```

## 📊 Comandos Principais

### Gerenciamento da Aplicação
```bash
# Iniciar aplicação
npm run pm2:start

# Parar aplicação
npm run pm2:stop

# Reiniciar aplicação
npm run pm2:restart

# Reload (zero downtime)
npm run pm2:reload

# Remover do PM2
npm run pm2:delete
```

### Monitoramento
```bash
# Ver status
npm run pm2:status

# Ver logs em tempo real
npm run pm2:logs

# Monitor interativo
npm run pm2:monitor

# Informações detalhadas
node pm2-scripts.js info
```

### Configuração do Sistema
```bash
# Configurar startup automático
npm run pm2:startup

# Salvar configuração atual
pm2 save

# Limpar logs
node pm2-scripts.js flush
```

## 📁 Estrutura de Arquivos

```
├── ecosystem.config.js     # Configuração principal do PM2
├── pm2-scripts.js         # Scripts de gerenciamento
├── powershell-server.js   # Aplicação principal
├── logs/                  # Diretório de logs
│   ├── pm2-combined.log   # Logs combinados
│   ├── pm2-out.log        # Logs de saída
│   └── pm2-error.log      # Logs de erro
└── .env                   # Variáveis de ambiente
```

## ⚙️ Configuração do ecosystem.config.js

### Principais configurações:

- **instances**: 1 (evita conflitos de monitoramento)
- **autorestart**: true (restart automático)
- **max_memory_restart**: 500M (restart se exceder memória)
- **restart_delay**: 5000ms (delay entre restarts)
- **max_restarts**: 10 (máximo de restarts por minuto)
- **cron_restart**: '0 2 * * *' (restart diário às 2h)

### Logs configurados:
- Logs combinados, de saída e erro separados
- Formato de data personalizado
- Rotação automática

## 🔍 Monitoramento e Logs

### Ver logs em tempo real
```bash
# Últimos 50 logs
npm run pm2:logs

# Seguir logs em tempo real
pm2 logs monday-automation-server --lines 0

# Logs de erro apenas
pm2 logs monday-automation-server --err
```

### Monitor interativo
```bash
npm run pm2:monitor
```
Mostra:
- CPU e memória em tempo real
- Número de restarts
- Uptime
- Logs em tempo real

## 🚀 Deploy em Produção

### Deploy completo (recomendado)
```bash
npm run pm2:deploy
```

Este comando:
1. Para a aplicação atual
2. Remove do PM2
3. Instala dependências
4. Inicia nova instância
5. Salva configuração
6. Mostra status final

### Deploy manual passo a passo
```bash
# 1. Parar aplicação
npm run pm2:stop

# 2. Atualizar código (git pull, etc.)
git pull origin main

# 3. Instalar dependências
npm install

# 4. Reload da aplicação
npm run pm2:reload
```

## 🔧 Configuração de Startup Automático

### Windows
```bash
# 1. Executar como administrador
npm run pm2:startup

# 2. Executar o comando gerado como administrador
# 3. Salvar configuração
pm2 save
```

### Linux/Mac
```bash
# 1. Gerar comando de startup
pm2 startup

# 2. Executar comando gerado com sudo
# 3. Salvar configuração
pm2 save
```

## 📊 Variáveis de Ambiente

Configuradas no `ecosystem.config.js`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
  MONITORING_ENABLED: 'true',
  LOG_LEVEL: 'info'
}
```

## 🔍 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs de erro
pm2 logs monday-automation-server --err

# Verificar configuração
node pm2-scripts.js info

# Reiniciar do zero
npm run pm2:delete
npm run pm2:deploy
```

### Alto uso de memória
```bash
# Verificar uso atual
pm2 monit

# Ajustar limite no ecosystem.config.js
# max_memory_restart: '300M'

# Reload configuração
pm2 reload ecosystem.config.js
```

### Muitos restarts
```bash
# Ver histórico de restarts
pm2 describe monday-automation-server

# Resetar contadores
node pm2-scripts.js reset

# Verificar logs para identificar causa
pm2 logs monday-automation-server --lines 100
```

## 📈 Monitoramento Avançado

### PM2 Plus (opcional)
```bash
# Conectar ao PM2 Plus para monitoramento web
pm2 plus
```

### Métricas customizadas
O servidor já inclui:
- Endpoint `/status` com métricas do monitoramento
- Logs estruturados com Winston
- Health checks automáticos

## 🔒 Segurança

### Recomendações:
1. **Não commitar** arquivos `.env` com tokens
2. **Configurar firewall** para porta 3001
3. **Usar HTTPS** em produção
4. **Monitorar logs** regularmente
5. **Backup** das configurações PM2

## 📞 Comandos de Emergência

```bash
# Parar TUDO do PM2
pm2 kill

# Reiniciar PM2 daemon
pm2 resurrect

# Status de todos os processos
pm2 list

# Informações do sistema
pm2 info
```

## 🎯 Próximos Passos

1. **Configurar monitoramento externo** (Grafana, New Relic)
2. **Implementar alertas** por email/Slack
3. **Configurar backup automático** dos logs
4. **Implementar health checks** externos
5. **Configurar load balancer** se necessário

---

## 📚 Links Úteis

- [Documentação PM2](https://pm2.keymetrics.io/docs/)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Monitoring](https://pm2.keymetrics.io/docs/usage/monitoring/)

---

**🚀 Monday Automation Server está pronto para produção com PM2!**