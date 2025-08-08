# Automação Monday.com - BOT

Sistema de automação para criação de pastas e cópia de modelos para projetos BOT no Monday.com.

## 📋 Pré-requisitos

- Node.js instalado
- Acesso ao Monday.com com token de API
- OneDrive configurado no usuário

## 🚀 Configuração

### 1. Instalar dependências
```bash
npm install fs-extra graphql-request dotenv
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` já está configurado para funcionar em qualquer máquina:

```env
MONDAY_API_TOKEN=seu_token_aqui
MONDAY_BOARD_ID=seu_board_id
BASE_USER_PATH=C:C:\Users\nasil01\OneDrive - Fagron\COM272 - FagronTech - Onboarding\# Backoffice\# BOT Extensão
MODEL_FILE_PATH={PROJECT_DIR}/modelo_fluxo.vsdx
```

**Placeholders automáticos:**
- `{USER}` - Substituído automaticamente pelo nome do usuário atual
- `{PROJECT_DIR}` - Substituído automaticamente pelo diretório do projeto

### 3. Obter Token Monday.com

1. Acesse Monday.com → Avatar → Admin → API
2. Gere um novo token com permissões de leitura/escrita
3. Substitua `seu_token_aqui` no arquivo `.env`

### 4. Obter Board ID

1. Acesse o board desejado no Monday.com
2. Copie o ID da URL (números após `/boards/`)
3. Substitua `seu_board_id` no arquivo `.env`

## 📁 Estrutura de Pastas

O sistema criará automaticamente:
```
C:/Users/[USUARIO]/OneDrive/
└── #Backoffice/
    └── #BOT Extensão/
        └── [CODIGO_CLIENTE]/
            └── Fluxo_Cliente_[CODIGO_CLIENTE].vsdx
```

## 🤖 Como Funciona

1. **Identificação**: Busca itens com palavras-chave: `bot`, `automação`, `rpa`
2. **Extração**: Extrai código do cliente (5+ dígitos) ou usa ID do item
3. **Criação**: Cria pasta com código do cliente
4. **Cópia**: Copia modelo `modelo_fluxo.vsdx` para a pasta
5. **Notificação**: Adiciona comentário no Monday.com mencionando o criador

## 🔧 Uso

### Execução normal
```bash
node bot_functions/create_folder.js
```

### Integração com webhook
O script pode ser integrado com webhooks do Monday.com para execução automática.
# Go horse