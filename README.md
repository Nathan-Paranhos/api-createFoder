# PowerShell Server API

Uma API REST para execução remota de comandos PowerShell, desenvolvida com Node.js e Express.

## 🚀 Funcionalidades

- **Execução de Comandos PowerShell**: Execute comandos PowerShell remotamente via API
- **Cópia de Arquivos**: Copie arquivos entre diretórios
- **Criação de Pastas**: Crie estruturas de diretórios
- **Verificação de Pastas**: Verifique se diretórios existem
- **Documentação Swagger**: Interface web para testar a API
- **Logs Estruturados**: Sistema de logging com Winston
- **Rate Limiting**: Proteção contra spam de requisições
- **CORS Habilitado**: Suporte para requisições cross-origin

## 📋 Endpoints

### POST `/api/execute-powershell`
Executa um comando PowerShell
```json
{
  "command": "Get-Date"
}
```

### POST `/api/copy-file`
Copia um arquivo
```json
{
  "source": "C:\\origem\\arquivo.txt",
  "destination": "C:\\destino\\arquivo.txt"
}
```

### POST `/api/create-folder`
Cria uma pasta
```json
{
  "folderPath": "C:\\nova\\pasta"
}
```

### GET `/api/check-folder?path=C:\pasta`
Verifica se uma pasta existe

### GET `/api/status`
Retorna o status da API

### GET `/api-docs`
Documentação Swagger da API

## 🛠️ Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PowerShell (Windows)

### Passos de Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/fagron/powershell-server-api
   cd powershell-server-api
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente (opcional):**
   ```env
   PORT=3002
   HOST=localhost
   NODE_ENV=production
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   # ou para desenvolvimento
   npm run dev
   ```

## 🌐 Deploy

Esta API está configurada para deploy em plataformas como Render, Heroku, ou qualquer serviço que suporte Node.js.

### Deploy no Render
1. Conecte seu repositório no Render
2. Configure o build command: `npm install`
3. Configure o start command: `npm start`
4. Defina a variável de ambiente `NODE_ENV=production`
5. A API estará disponível 24/7

### Deploy no Heroku
1. Instale o Heroku CLI
2. Faça login: `heroku login`
3. Crie uma app: `heroku create sua-app-name`
4. Deploy: `git push heroku main`

## 📚 Documentação da API

### Acesso à Documentação Swagger

Após iniciar o servidor, acesse a documentação interativa em:
```
http://localhost:3002/api-docs
```

## 🔒 Segurança

- **Rate Limiting**: 100 requisições por 15 minutos por IP
- **Helmet.js**: Headers de segurança configurados
- **Validação de Entrada**: Todos os endpoints validam dados de entrada
- **Logs Detalhados**: Todas as operações são logadas com timestamp
- **CORS Configurado**: Controle de acesso cross-origin

## 📝 Logs

Todos os comandos PowerShell executados são logados com:
- Timestamp da execução
- Comando executado
- Resultado da execução
- Possíveis erros

## 🚀 Uso da API

### Exemplo com cURL

```bash
# Executar comando PowerShell
curl -X POST http://localhost:3002/api/execute-powershell \
  -H "Content-Type: application/json" \
  -d '{"command": "Get-Date"}'

# Criar pasta
curl -X POST http://localhost:3002/api/create-folder \
  -H "Content-Type: application/json" \
  -d '{"folderPath": "C:\\teste\\nova-pasta"}'

# Verificar status
curl http://localhost:3002/api/status
```

### Exemplo com JavaScript

```javascript
// Executar comando PowerShell
const response = await fetch('http://localhost:3002/api/execute-powershell', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    command: 'Get-ChildItem C:\\'
  })
});

const result = await response.json();
console.log(result);
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação Swagger](http://localhost:3002/api-docs)
2. Consulte os logs da aplicação
3. Abra uma [issue](https://github.com/fagron/powershell-server-api/issues)

## 🔄 Changelog

### v2.0.0
- Simplificação da API para servidor PowerShell básico
- Remoção da integração com Monday.com
- Melhoria na documentação
- Otimização para deploy em produção

### v1.0.0
- Versão inicial com integração Monday.com
- Funcionalidades básicas de PowerShell