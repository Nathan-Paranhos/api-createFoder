/**
 * Monday Automation API Server
 * Servidor API profissional para automação Monday.com
 * 
 * @author Fagron Automation Team
 * @version 2.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Importar configurações e utilitários
import environmentConfig, { getCurrentEnvironment, isDevelopment } from './config/environment.js';
import { logger, httpLogger, logError, logPowerShellOperation, logFileOperation } from './utils/logger.js';
import { createValidationMiddleware, endpointValidations, sanitizeOutput } from './utils/validators.js';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do ambiente atual
const CONFIG = environmentConfig;
const CURRENT_ENVIRONMENT = getCurrentEnvironment();
const SERVER_PORT = CONFIG.server.port;
const SERVER_HOST = CONFIG.server.host;

// Inicializar aplicação Express
const expressApplication = express();

// Log de inicialização
logger.info('Starting Monday Automation API Server', {
  environment: CURRENT_ENVIRONMENT,
  port: SERVER_PORT,
  host: SERVER_HOST,
  nodeVersion: process.version
});

// ============================================================================
// SWAGGER DOCUMENTATION CONFIGURATION
// ============================================================================

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PowerShell Server API',
    version: '2.0.0',
    description: `
      API servidor PowerShell para execução remota de comandos com funcionalidades de:
      - Criação e gerenciamento de pastas
      - Execução segura de comandos PowerShell
      - Cópia de arquivos
      - Sistema de logging e monitoramento
      
      Ambiente atual: ${CURRENT_ENVIRONMENT}
    `,
    contact: {
      name: 'Fagron Automation Team',
      email: 'automation@fagron.com',
      url: 'https://fagron.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://${SERVER_HOST}:${SERVER_PORT}`,
      description: `Servidor ${CURRENT_ENVIRONMENT}`
    }
  ],
  components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            }
          }
        },
        PowerShellResult: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            output: {
              type: 'string',
              description: 'Saída do comando PowerShell'
            },
            error: {
              type: 'string',
              description: 'Erro do comando PowerShell (se houver)'
            }
          }
        }
      }
    }
};

const swaggerSpecification = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./api-server.js']
});

// ============================================================================
// SECURITY AND MIDDLEWARE CONFIGURATION
// ============================================================================

// Helmet para segurança HTTP
if (CONFIG.security.enableHelmet) {
  expressApplication.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
}

// Rate Limiting
if (CONFIG.security.enableRateLimit) {
  const apiRateLimiter = rateLimit({
    windowMs: CONFIG.api.rateLimitWindowMs,
    max: CONFIG.api.rateLimitMaxRequests,
    message: {
      success: false,
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: Math.ceil(CONFIG.api.rateLimitWindowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      res.status(429).json({
        success: false,
        error: 'Limite de requisições excedido. Tente novamente mais tarde.'
      });
    }
  });
  
  expressApplication.use('/api/', apiRateLimiter);
}

// CORS Configuration
expressApplication.use(cors({
  origin: CONFIG.server.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
}));

// Body parsing middleware
expressApplication.use(express.json({ 
  limit: CONFIG.api.maxRequestSize,
  type: 'application/json'
}));
expressApplication.use(express.urlencoded({ 
  extended: true, 
  limit: CONFIG.api.maxRequestSize 
}));

// Static files
expressApplication.use(express.static('public'));

// HTTP Request Logging
expressApplication.use(httpLogger);

// Request timeout middleware
expressApplication.use((req, res, next) => {
  req.setTimeout(CONFIG.api.requestTimeout, () => {
    logger.warn('Request timeout', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Timeout da requisição'
      });
    }
  });
  next();
});

// ============================================================================
// SWAGGER DOCUMENTATION SETUP
// ============================================================================

expressApplication.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecification, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b4151; }
  `,
  customSiteTitle: `Monday Automation API - ${CURRENT_ENVIRONMENT}`,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Executa comando PowerShell de forma segura
 * @param {string} powershellCommand - Comando a ser executado
 * @param {number} executionTimeout - Timeout em milissegundos
 * @returns {Promise<Object>} Resultado da execução
 */
const executePowerShellCommand = (powershellCommand, executionTimeout = CONFIG.powershell.executionTimeout) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    logger.debug('Executing PowerShell command', { 
      command: powershellCommand.substring(0, 100),
      timeout: executionTimeout 
    });
    
    const powershellProcess = spawn('powershell', ['-Command', powershellCommand], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: executionTimeout
    });
    
    let standardOutput = '';
    let errorOutput = '';
    
    powershellProcess.stdout.on('data', (data) => {
      standardOutput += data.toString();
      // Limitar tamanho da saída
      if (standardOutput.length > CONFIG.powershell.maxOutputLength) {
        powershellProcess.kill('SIGTERM');
        resolve({
          success: false,
          error: 'Saída do comando excedeu o limite máximo permitido'
        });
      }
    });
    
    powershellProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    powershellProcess.on('close', (exitCode) => {
      const executionDuration = Date.now() - startTime;
      const result = {
        success: exitCode === 0,
        output: sanitizeOutput(standardOutput.trim()),
        error: exitCode !== 0 ? sanitizeOutput(errorOutput.trim()) : null,
        exitCode,
        duration: executionDuration
      };
      
      logPowerShellOperation(powershellCommand, result, executionDuration);
      resolve(result);
    });
    
    powershellProcess.on('error', (error) => {
      const executionDuration = Date.now() - startTime;
      const result = {
        success: false,
        error: `Erro ao executar comando: ${error.message}`,
        duration: executionDuration
      };
      
      logPowerShellOperation(powershellCommand, result, executionDuration);
      resolve(result);
    });
    
    // Timeout manual
    setTimeout(() => {
      if (!powershellProcess.killed) {
        powershellProcess.kill('SIGTERM');
        const result = {
          success: false,
          error: `Comando excedeu o timeout de ${executionTimeout}ms`
        };
        logPowerShellOperation(powershellCommand, result, executionTimeout);
        resolve(result);
      }
    }, executionTimeout);
  });
};

/**
 * Middleware para tratamento de erros global
 */
const globalErrorHandler = (error, req, res, next) => {
  logError(error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (res.headersSent) {
    return next(error);
  }
  
  const statusCode = error.statusCode || 500;
  const message = isDevelopment() ? error.message : 'Erro interno do servidor';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDevelopment() && { stack: error.stack })
  });
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Informações da API
 *     description: Retorna informações básicas sobre a API PowerShell Server
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Informações da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 name:
 *                   type: string
 *                   example: "PowerShell Server API"
 *                 version:
 *                   type: string
 *                   example: "2.0.0"
 *                 environment:
 *                   type: string
 *                   example: "production"
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/api/create-folder", "/api/copy-file", "/api/execute-powershell", "/api/check-folder", "/api/status"]
 *                 documentation:
 *                   type: string
 *                   example: "/api-docs"
 */
expressApplication.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'PowerShell Server API',
    version: '2.0.0',
    environment: CURRENT_ENVIRONMENT,
    description: 'API servidor PowerShell para execução remota de comandos',
    endpoints: [
      '/api/create-folder',
      '/api/copy-file', 
      '/api/execute-powershell',
      '/api/check-folder',
      '/api/status'
    ],
    documentation: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/create-folder:
 *   post:
 *     summary: Criar pasta no sistema
 *     description: Cria uma nova pasta no caminho especificado
 *     tags: [Folder Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folderPath
 *             properties:
 *               folderPath:
 *                 type: string
 *                 description: Caminho completo da pasta a ser criada
 *                 example: "C:\\temp\\nova-pasta"
 *     responses:
 *       200:
 *         description: Pasta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
expressApplication.post('/api/create-folder', 
  createValidationMiddleware(endpointValidations.createFolder),
  async (req, res, next) => {
    try {
      const { folderPath } = req.body;
      
      logger.info('Creating folder', { folderPath, ip: req.ip });
      
      const powershellCommand = `New-Item -ItemType Directory -Path "${folderPath}" -Force`;
      const executionResult = await executePowerShellCommand(powershellCommand);
      
      if (executionResult.success) {
        logFileOperation('create_folder', folderPath, true);
        res.json({
          success: true,
          message: 'Pasta criada com sucesso',
          output: executionResult.output,
          path: folderPath
        });
      } else {
        logFileOperation('create_folder', folderPath, false, executionResult.error);
        res.status(500).json({
          success: false,
          error: executionResult.error || 'Erro ao criar pasta'
        });
      }
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/copy-file:
 *   post:
 *     summary: Copiar arquivo
 *     description: Copia um arquivo de origem para destino usando PowerShell
 *     tags: [Gerenciamento de Arquivos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourcePath
 *               - destinationPath
 *             properties:
 *               sourcePath:
 *                 type: string
 *                 description: Caminho do arquivo de origem
 *                 example: "C:\\Modelos\\template.xlsx"
 *               destinationPath:
 *                 type: string
 *                 description: Caminho de destino do arquivo
 *                 example: "C:\\Projetos\\novo_arquivo.xlsx"
 *     responses:
 *       200:
 *         description: Arquivo copiado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PowerShellResult'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
expressApplication.post('/api/copy-file', async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;
    
    // Validação de entrada
    if (!sourcePath || typeof sourcePath !== 'string' || sourcePath.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'sourcePath é obrigatório e deve ser uma string válida'
      });
    }
    
    if (!destinationPath || typeof destinationPath !== 'string' || destinationPath.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'destinationPath é obrigatório e deve ser uma string válida'
      });
    }
    
    // Validação de caminhos
    if (sourcePath.length > 260 || destinationPath.length > 260) {
      return res.status(400).json({
        success: false,
        error: 'Caminhos muito longos (máximo 260 caracteres cada)'
      });
    }

    console.log(`📄 Copiando arquivo de ${sourcePath} para ${destinationPath}`);

    // Verificar se o arquivo de origem existe
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de origem não encontrado'
      });
    }

    // Comando PowerShell para copiar arquivo
    const psCommand = `Copy-Item -Path "${sourcePath}" -Destination "${destinationPath}" -Force`;
    
    const result = await executePowerShellCommand(psCommand);
    
    if (result.success) {
      console.log(`✅ Arquivo copiado com sucesso`);
      res.json({
        success: true,
        message: 'Arquivo copiado com sucesso',
        sourcePath,
        destinationPath,
        output: result.output
      });
    } else {
      console.error(`❌ Erro ao copiar arquivo: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro no endpoint copy-file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/execute-powershell:
 *   post:
 *     summary: Executar comando PowerShell personalizado
 *     description: Executa um comando PowerShell arbitrário no sistema
 *     tags: [PowerShell]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *                 description: Comando PowerShell a ser executado
 *                 example: "Get-ChildItem C:\\"
 *               timeout:
 *                 type: integer
 *                 description: "Timeout em milissegundos (padrão: 30000)"
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Comando executado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PowerShellResult'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
expressApplication.post('/api/execute-powershell', async (req, res) => {
  try {
    const { command, timeout = 30000 } = req.body;
    
    // Validação de entrada
    if (!command || typeof command !== 'string' || command.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'command é obrigatório e deve ser uma string válida'
      });
    }
    
    // Validação de timeout
    if (typeof timeout !== 'number' || timeout < 1000 || timeout > 300000) {
      return res.status(400).json({
        success: false,
        error: 'timeout deve ser um número entre 1000 e 300000 milissegundos'
      });
    }
    
    // Comandos perigosos bloqueados
    const dangerousCommands = ['Remove-Item', 'rm ', 'del ', 'format', 'shutdown', 'restart'];
    const lowerCommand = command.toLowerCase();
    
    for (const dangerous of dangerousCommands) {
      if (lowerCommand.includes(dangerous.toLowerCase())) {
        return res.status(403).json({
          success: false,
          error: `Comando '${dangerous}' não é permitido por segurança`
        });
      }
    }

    console.log(`⚡ Executando comando PowerShell: ${command}`);
    
    const result = await executePowerShellCommand(command);
    
    if (result.success) {
      console.log(`✅ Comando executado com sucesso`);
      res.json({
        success: true,
        message: 'Comando executado com sucesso',
        command,
        output: result.output
      });
    } else {
      console.error(`❌ Erro ao executar comando: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error,
        command
      });
    }
  } catch (error) {
    console.error('Erro no endpoint execute-powershell:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/check-folder:
 *   get:
 *     summary: Verificar se pasta existe
 *     description: Verifica se uma pasta existe no sistema
 *     tags: [Gerenciamento de Pastas]
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Caminho da pasta a ser verificada
 *         example: "C:\\Projetos\\MinhasPastas"
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 exists:
 *                   type: boolean
 *                   description: Indica se a pasta existe
 *                 path:
 *                   type: string
 *                   description: Caminho verificado
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
expressApplication.get('/api/check-folder', (req, res) => {
  try {
    const { path: folderPath } = req.query;
    
    // Validação de entrada
    if (!folderPath || typeof folderPath !== 'string' || folderPath.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'path é obrigatório e deve ser uma string válida'
      });
    }
    
    // Validação de caminho
    if (folderPath.length > 260) {
      return res.status(400).json({
        success: false,
        error: 'Caminho muito longo (máximo 260 caracteres)'
      });
    }

    const exists = fs.existsSync(folderPath);
    
    res.json({
      success: true,
      exists,
      path: folderPath
    });
  } catch (error) {
    console.error('Erro no endpoint check-folder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Status da API
 *     description: Verifica se a API está funcionando e retorna informações básicas
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: API funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API Monday Automation funcionando"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-02T14:30:00.000Z"
 *                 port:
 *                   type: integer
 *                   example: 3002
 */
expressApplication.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API Monday Automation funcionando',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Middleware de tratamento de erros
expressApplication.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Iniciar servidor
expressApplication.listen(SERVER_PORT, SERVER_HOST, () => {
  logger.info('🚀 API Monday Automation iniciada com sucesso', {
    host: SERVER_HOST,
    port: SERVER_PORT,
    environment: CURRENT_ENVIRONMENT,
    nodeVersion: process.version
  });
  
  console.log(`🚀 PowerShell Server API rodando em http://${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`📁 Pronto para executar comandos PowerShell remotamente!`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   POST /api/create-folder - Criar pastas`);
  console.log(`   POST /api/copy-file - Copiar arquivos`);
  console.log(`   POST /api/execute-powershell - Executar comandos PowerShell`);
  console.log(`   GET  /api/check-folder - Verificar se pasta existe`);
  console.log(`   GET  /api/status - Status da API`);
  console.log(`   GET  /api-docs - Documentação Swagger`);
});

export default expressApplication;