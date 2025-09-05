# Monday.com Automation Bot

Sistema de automação para criação automática de pastas baseado em itens do Monday.com.

## Funcionalidades

- 🤖 Monitora itens com produto "BOT" e status "Na Fila"
- 📁 Cria pastas automaticamente nos diretórios corretos
- 📋 Copia arquivo modelo VSDX para cada pasta
- 💬 Notifica no Monday.com com status e menciona responsáveis
- 🔄 Sistema de retry para APIs
- 📊 Logs detalhados com Winston

## Configuração

1. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure as variáveis no arquivo `.env`:
   - `MONDAY_API_TOKEN`: Token da API Monday.com
   - `MONDAY_BOARD_ID`: ID do board a ser monitorado
   - Caminhos dos diretórios de destino
   - Emails dos responsáveis por produto

3. Instale as dependências:
   ```bash
   npm install
   ```

## Uso

### Execução única
```bash
node create_folder.js
```

### Modo desenvolvimento (watch)
```bash
npm run dev
```

## Estrutura de Produtos

- **Fórmula Certa**: Pastas criadas em `FORMULA_CERTA_PATH`
- **Phusion**: Pastas criadas em `PHUSION_PATH`
- **Outros**: Pastas criadas em `PHUSION_PATH` (padrão)

## Logs

Os logs são salvos em:
- `logs/error.log`: Apenas erros
- `logs/combined.log`: Todos os logs
- Console: Logs em tempo real

## Dependências

- `dotenv`: Gerenciamento de variáveis de ambiente
- `node-fetch`: Cliente HTTP para APIs
- `winston`: Sistema de logging avançado

## Versão

**v3.2.2** - Sistema completo e autossuficiente