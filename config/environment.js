/**
 * Environment Configuration
 * Configurações de ambiente para desenvolvimento, teste e produção
 */

const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production'
};

const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;
};

const isDevelopment = () => getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT;
const isTest = () => getCurrentEnvironment() === ENVIRONMENTS.TEST;
const isProduction = () => getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION;

const environmentConfig = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    server: {
      port: process.env.PORT || 3002,
      host: process.env.HOST || 'localhost',
      corsOrigins: [
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002'
      ]
    },
    api: {
      requestTimeout: 30000, // 30 segundos
      maxRequestSize: '10mb',
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
      rateLimitMaxRequests: 100
    },
    powershell: {
      executionTimeout: 60000, // 60 segundos
      maxOutputLength: 1000000, // 1MB
      blockedCommands: [
        'Remove-Item', 'del', 'rmdir', 'rd',
        'format', 'diskpart', 'reg delete',
        'net user', 'net localgroup',
        'shutdown', 'restart-computer',
        'stop-service', 'remove-service'
      ]
    },
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: false
    },
    security: {
      enableHelmet: true,
      enableRateLimit: true,
      maxPathLength: 260
    }
  },

  [ENVIRONMENTS.TEST]: {
    server: {
      port: process.env.TEST_PORT || 3003,
      host: process.env.TEST_HOST || 'localhost',
      corsOrigins: ['http://localhost:3003']
    },
    api: {
      requestTimeout: 10000, // 10 segundos
      maxRequestSize: '5mb',
      rateLimitWindowMs: 5 * 60 * 1000, // 5 minutos
      rateLimitMaxRequests: 50
    },
    powershell: {
      executionTimeout: 30000, // 30 segundos
      maxOutputLength: 500000, // 500KB
      blockedCommands: [
        'Remove-Item', 'del', 'rmdir', 'rd',
        'format', 'diskpart', 'reg delete',
        'net user', 'net localgroup',
        'shutdown', 'restart-computer',
        'stop-service', 'remove-service'
      ]
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableFile: true
    },
    security: {
      enableHelmet: true,
      enableRateLimit: true,
      maxPathLength: 260
    }
  },

  [ENVIRONMENTS.PRODUCTION]: {
    server: {
      port: process.env.PORT || 8080,
      host: process.env.HOST || '0.0.0.0',
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []
    },
    api: {
      requestTimeout: 60000, // 60 segundos
      maxRequestSize: '50mb',
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
      rateLimitMaxRequests: 1000
    },
    powershell: {
      executionTimeout: 300000, // 5 minutos
      maxOutputLength: 5000000, // 5MB
      blockedCommands: [
        'Remove-Item', 'del', 'rmdir', 'rd',
        'format', 'diskpart', 'reg delete',
        'net user', 'net localgroup',
        'shutdown', 'restart-computer',
        'stop-service', 'remove-service',
        'invoke-webrequest', 'curl', 'wget'
      ]
    },
    logging: {
      level: 'warn',
      enableConsole: false,
      enableFile: true
    },
    security: {
      enableHelmet: true,
      enableRateLimit: true,
      maxPathLength: 260
    }
  }
};

const getConfig = () => {
  const currentEnv = getCurrentEnvironment();
  return environmentConfig[currentEnv] || environmentConfig[ENVIRONMENTS.DEVELOPMENT];
};

export {
  ENVIRONMENTS,
  getCurrentEnvironment,
  isDevelopment,
  isTest,
  isProduction,
  getConfig
};

export default getConfig();