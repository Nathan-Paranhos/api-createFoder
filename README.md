# Automação Monday.com

Sistema de automação para integração com Monday.com que permite criação automática de pastas e distribuição de demandas.

## 🚀 Funcionalidades

- **Criação Automática de Pastas**: Cria pastas organizadas baseadas no produto principal (Fórmula Certa ou Phusion)
- **Distribuição Inteligente**: Distribui automaticamente as pastas nos diretórios corretos
- **Interface Web**: Interface simples e intuitiva para executar as automações
- **Integração Monday.com**: Conecta diretamente com a API do Monday.com
- **Cópia de Modelos**: Copia automaticamente arquivos modelo (.vsdx) para as pastas criadas

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- Conta no Monday.com com API token
- Windows PowerShell

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/VenciguerJ/automation_monday.git
cd automation_monday
```

2. Instale as dependências:
```bash
npm install
cd automation_monday/bot_functions
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp bot_functions/.env.example bot_functions/.env
```

4. Edite o arquivo `.env` com suas configurações:
- `MONDAY_API_TOKEN`: Seu token da API do Monday.com
- `MONDAY_BOARD_ID`: ID do board no Monday.com
- Configure os caminhos dos diretórios conforme sua estrutura

## 🖥️ Uso

### Iniciar o Servidor

```bash
node powershell-server.js
```

O servidor será iniciado em `http://localhost:3001`

### Interface Web

1. Abra o navegador e acesse `http://localhost:3001`
2. Clique em "Criação de todas pasta" para executar a automação
3. O sistema irá:
   - Buscar itens na fila do Monday.com
   - Identificar o produto principal
   - Criar pastas nos diretórios corretos
   - Copiar arquivos modelo
   - Notificar os responsáveis

### Execução via CLI

```bash
cd bot_functions
node create_folder.js
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