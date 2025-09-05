# 🤖 Monday Automation Server

> Sistema completo de automação para Monday.com com criação automática de pastas e integração com API externa

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-External-orange.svg)](https://api-createfoder.onrender.com)

## 📋 Visão Geral

O **Monday Automation Server** é um sistema robusto que monitora quadros do Monday.com e automatiza a criação de estruturas de pastas baseadas nos itens detectados. O sistema utiliza uma API externa para operações de sistema de arquivos e mantém fallback local para máxima confiabilidade.

### 🚀 Funcionalidades Principais

- 🔄 **Monitoramento Automático** - Verifica quadros Monday.com em tempo real
- 📁 **Criação Inteligente de Pastas** - Estruturas baseadas em produtos (Phusion/Fórmula Certa)
- 🌐 **API Externa Integrada** - Usa https://api-createfoder.onrender.com
- 🛡️ **Sistema de Fallback** - Operação local se API externa falhar
- 📊 **Logs Estruturados** - Winston para rastreamento completo
- 🔄 **Sistema de Retry** - 3 tentativas automáticas com delay
- 📧 **Notificações Automáticas** - Email para responsáveis
- 🎯 **Interface Web** - Controle via navegador

## 🛠️ Tecnologias

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **Winston** - Sistema de logs
- **Monday.com GraphQL API** - Integração com Monday
- **API Externa** - Operações de sistema de arquivos
- **HTML/CSS/JS** - Interface web responsiva

## 📦 Instalação

### Pré-requisitos

- Node.js 18 ou superior
- Token de API do Monday.com
- Acesso à internet (para API externa)

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/monday-automation-server.git
   cd monday-automation-server
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Execute o sistema**
   ```bash
   npm start
   ```

## ⚙️ Configuração

### Arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```env
# API Monday.com
MONDAY_API_TOKEN=seu_token_monday_aqui
MONDAY_BOARD_ID=9653232918

# Configurações de Monitoramento
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
STATUS_COLUMN_ID=status_1
ETAPA_COLUMN_ID=status35
TARGET_STATUS=BOT
TARGET_ETAPA=Contato Inicial

# Caminhos de Pastas
BASE_USER_PATH=C:\\Users\\seu_usuario\\OneDrive - Fagron
FORMULA_CERTA_PATH=COM272 - FagronTech - Onboarding
PHUSION_PATH=COM272 - FagronTech - Onboarding
MODEL_FILE_PATH=modelo.xlsx

# Emails dos Responsáveis
RESPONSAVEL_PHUSION_EMAIL=responsavel.phusion@empresa.com
RESPONSAVEL_FCERTA_EMAIL=responsavel.fcerta@empresa.com

# Configurações de Sistema
MAX_RETRIES=3
RETRY_DELAY=1000
API_TIMEOUT=30000
LOG_LEVEL=info
```

### Configuração do Monday.com

1. **Obtenha o Token de API**
   - Acesse Monday.com → Avatar → Admin → API
   - Gere um novo token com permissões de leitura/escrita

2. **Configure o Board ID**
   - Acesse seu quadro no Monday.com
   - O ID está na URL: `monday.com/boards/SEU_BOARD_ID`

3. **Identifique as Colunas**
   - Status: Coluna que contém "BOT"
   - Etapa: Coluna que contém "Contato Inicial"

## 🚀 Uso

### Execução Básica

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Criar pastas manualmente
npm run create-folders
```

### Interface Web

Acesse `http://localhost:3001` para:

- 📊 **Dashboard** - Visão geral do sistema
- 🔧 **Controles** - Iniciar/parar monitoramento
- 📋 **Logs** - Visualizar atividades em tempo real
- 📁 **Pastas** - Gerenciar criação manual

### API Externa

O sistema utiliza a API externa `https://api-createfoder.onrender.com` para:

- **Criação de pastas** remotas
- **Cópia de arquivos** entre diretórios
- **Execução de comandos** PowerShell
- **Verificação de diretórios**

## 📊 Monitoramento

### Logs Estruturados

O sistema gera logs detalhados com Winston:

```javascript
// Exemplo de log
{
  "level": "info",
  "message": "Pasta criada com sucesso",
  "pasta": "C:\\Users\\...\\123456",
  "produto": "phusion",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

### Métricas

- **Total de verificações** realizadas
- **Itens encontrados** no Monday.com
- **Pastas criadas** com sucesso
- **Erros ocorridos** e tratados
- **Tempo de resposta** da API externa

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
├── bot_functions/          # Lógica principal
│   ├── create_folder.js    # Criação de pastas
│   ├── auto_queue.js       # Monitoramento Monday
│   └── package.json        # Dependências específicas
├── Assets/                 # Recursos visuais
├── config.js              # Configuração da API externa
├── bot.html               # Interface principal
├── waba.html              # Interface WhatsApp
├── diagnosticos.html      # Página de diagnósticos
└── package.json           # Dependências principais
```

### Scripts Disponíveis

```bash
# Desenvolvimento com watch
npm run dev

# Produção
npm start

# Executar apenas criação de pastas
npm run create-folders

# Executar monitoramento
npm run monitor

# Testes
npm test
```

### Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de Token Monday.com**
```
Erro: HTTP 401 - Token inválido
```
- Verifique se o token está correto no `.env`
- Confirme as permissões do token no Monday.com

**API Externa Indisponível**
```
API falhou, usando criação local
```
- Normal - sistema usa fallback local automaticamente
- Verifique conectividade com https://api-createfoder.onrender.com

**Pasta não criada**
```
Erro: EPERM operation not permitted
```
- Verifique permissões de escrita no diretório
- Execute como administrador se necessário

### Logs de Debug

Para logs detalhados, configure:

```env
LOG_LEVEL=debug
```

## 📁 Estrutura do Projeto

```
automation_monday/
├── automation_monday/
│   ├── Assets/                 # Recursos estáticos
│   ├── bot_functions/          # Scripts de automação
│   │   ├── create_folder.js    # Script principal de criação de pastas
│   │   ├── .env               # Variáveis de ambiente (não versionado)
│   │   ├── .env.example       # Exemplo de configuração
│   │   └── package.json       # Dependências do bot
│   ├── bot.html               # Interface web principal
│   ├── powershell-server.js   # Servidor Express
│   └── Modelo - Fluxo de atendimento BOT Numérico.vsdx
└── README.md
```

## 🔄 Fluxo de Funcionamento

1. **Busca de Itens**: O sistema busca itens com status "Na Fila" e produto "BOT" no Monday.com
2. **Identificação do Produto**: Analisa o campo "Produto Principal" para determinar se é Fórmula Certa ou Phusion
3. **Criação de Pastas**: Cria pastas nos diretórios apropriados:
   - Fórmula Certa → `#FCERTA EXTENSÃO`
   - Phusion → `#PHUSION EXTENSÃO`
4. **Cópia de Modelo**: Copia o arquivo modelo VSDX para cada pasta criada
5. **Notificação**: Atualiza o item no Monday.com com informações da pasta criada

## 🛠️ Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Monday.com API**: Integração com a plataforma
- **PowerShell**: Execução de comandos no Windows
- **Bootstrap**: Interface responsiva
- **Winston**: Sistema de logs

## 📝 Configuração de Produtos

O sistema identifica produtos através dos seguintes critérios:

- **Fórmula Certa**: Textos contendo "fórmula certa" ou "formula certa"
- **Phusion**: Textos contendo "phusion"
- **Padrão**: Produtos não identificados são direcionados para Phusion

## 🔐 Segurança

- Tokens de API não são versionados (incluídos no .gitignore)
- Validação de entrada nos endpoints
- Tratamento de erros robusto
- Logs detalhados para auditoria

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Jean Vencigueri** - *Desenvolvimento inicial* - [VenciguerJ](https://github.com/VenciguerJ)

## 📞 Suporte

Para suporte, entre em contato através do GitHub Issues ou email: jean.vencigueri@fagrontech.com.br