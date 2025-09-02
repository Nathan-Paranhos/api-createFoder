/**
 * Logger Configuration
 * Sistema de logging profissional com Winston
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, isDevelopment } from '../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = getConfig();

// Definir níveis de log customizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Cores para cada nível
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Adicionar cores ao winston
winston.addColors(logColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    
    return logMessage;
  })
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    if (stack && isDevelopment()) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

// Configurar transports
const transports = [];

// Console transport (sempre ativo em desenvolvimento)
if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level
    })
  );
}

// File transports (para teste e produção)
if (config.logging.enableFile) {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  // Log de erros
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  levels: logLevels,
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false
});

// Middleware para logging de requisições HTTP
const httpLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  // Log da requisição
  logger.http(`${method} ${url}`, {
    ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length')
  });
  
  // Interceptar resposta para log
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    logger.http(`${method} ${url} - ${statusCode}`, {
      duration: `${duration}ms`,
      responseSize: data ? data.length : 0,
      ip
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Função para log de erros de aplicação
const logError = (error, context = {}) => {
  logger.error(error.message || error, {
    stack: error.stack,
    ...context
  });
};

// Função para log de operações PowerShell
const logPowerShellOperation = (command, result, duration) => {
  const logData = {
    command: command.substring(0, 100), // Limitar tamanho do comando no log
    duration: `${duration}ms`,
    success: result.success
  };
  
  if (result.success) {
    logger.info('PowerShell command executed successfully', logData);
  } else {
    logger.warn('PowerShell command failed', {
      ...logData,
      error: result.error
    });
  }
};

// Função para log de operações de arquivo
const logFileOperation = (operation, filePath, success, error = null) => {
  const logData = {
    operation,
    filePath: filePath.substring(0, 100), // Limitar tamanho do path
    success
  };
  
  if (success) {
    logger.info(`File operation completed: ${operation}`, logData);
  } else {
    logger.error(`File operation failed: ${operation}`, {
      ...logData,
      error: error?.message || error
    });
  }
};

export {
  logger,
  httpLogger,
  logError,
  logPowerShellOperation,
  logFileOperation
};

export default logger;