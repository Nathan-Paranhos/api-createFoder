/**
 * Input Validation Utilities
 * Utilitários para validação de entrada e segurança
 */

import path from 'path';
import { getConfig } from '../config/environment.js';
import { logError } from './logger.js';

const config = getConfig();

/**
 * Classe para erros de validação
 */
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validadores básicos
 */
const validators = {
  /**
   * Valida se um valor é uma string não vazia
   */
  isNonEmptyString: (value, fieldName = 'campo') => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} deve ser uma string não vazia`, fieldName);
    }
    return value.trim();
  },

  /**
   * Valida se um valor é um número válido
   */
  isValidNumber: (value, fieldName = 'campo', min = null, max = null) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} deve ser um número válido`, fieldName);
    }
    if (min !== null && num < min) {
      throw new ValidationError(`${fieldName} deve ser maior ou igual a ${min}`, fieldName);
    }
    if (max !== null && num > max) {
      throw new ValidationError(`${fieldName} deve ser menor ou igual a ${max}`, fieldName);
    }
    return num;
  },

  /**
   * Valida se um caminho de arquivo é seguro
   */
  isValidFilePath: (filePath, fieldName = 'caminho') => {
    const cleanPath = validators.isNonEmptyString(filePath, fieldName);
    
    // Verificar comprimento máximo
    if (cleanPath.length > config.security.maxPathLength) {
      throw new ValidationError(
        `${fieldName} não pode exceder ${config.security.maxPathLength} caracteres`,
        fieldName
      );
    }
    
    // Verificar caracteres perigosos
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(cleanPath)) {
      throw new ValidationError(
        `${fieldName} contém caracteres inválidos: < > : " | ? *`,
        fieldName
      );
    }
    
    // Verificar tentativas de path traversal
    const normalizedPath = path.normalize(cleanPath);
    if (normalizedPath.includes('..')) {
      throw new ValidationError(
        `${fieldName} não pode conter referências de diretório pai (..)`,
        fieldName
      );
    }
    
    return normalizedPath;
  },

  /**
   * Valida timeout para comandos PowerShell
   */
  isValidTimeout: (timeout, fieldName = 'timeout') => {
    const timeoutNum = validators.isValidNumber(timeout, fieldName, 1, 300);
    return timeoutNum * 1000; // Converter para milissegundos
  },

  /**
   * Valida se um comando PowerShell é seguro
   */
  isSecurePowerShellCommand: (command, fieldName = 'comando') => {
    const cleanCommand = validators.isNonEmptyString(command, fieldName);
    
    // Verificar comandos bloqueados
    const blockedCommands = config.powershell.blockedCommands;
    const lowerCommand = cleanCommand.toLowerCase();
    
    for (const blockedCmd of blockedCommands) {
      if (lowerCommand.includes(blockedCmd.toLowerCase())) {
        throw new ValidationError(
          `Comando '${blockedCmd}' não é permitido por motivos de segurança`,
          fieldName
        );
      }
    }
    
    // Verificar caracteres suspeitos
    const suspiciousPatterns = [
      /;\s*rm\s+/i,
      /;\s*del\s+/i,
      /\|\s*rm\s+/i,
      /\|\s*del\s+/i,
      /&&\s*rm\s+/i,
      /&&\s*del\s+/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(cleanCommand)) {
        throw new ValidationError(
          'Comando contém padrões potencialmente perigosos',
          fieldName
        );
      }
    }
    
    return cleanCommand;
  },

  /**
   * Valida se um objeto tem as propriedades obrigatórias
   */
  hasRequiredProperties: (obj, requiredProps, objectName = 'objeto') => {
    if (!obj || typeof obj !== 'object') {
      throw new ValidationError(`${objectName} deve ser um objeto válido`);
    }
    
    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        throw new ValidationError(
          `Propriedade obrigatória '${prop}' não encontrada em ${objectName}`,
          prop
        );
      }
    }
    
    return obj;
  }
};

/**
 * Middleware para validação de requisições
 */
const createValidationMiddleware = (validationRules) => {
  return (req, res, next) => {
    try {
      // Aplicar regras de validação
      for (const [field, rules] of Object.entries(validationRules)) {
        let value = req.body[field];
        
        // Aplicar cada regra de validação
        for (const rule of rules) {
          if (typeof rule === 'function') {
            value = rule(value, field);
          } else if (typeof rule === 'object' && rule.validator) {
            value = rule.validator(value, field, ...(rule.args || []));
          }
        }
        
        // Atualizar valor validado
        req.body[field] = value;
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          field: error.field
        });
      }
      
      logError(error, { context: 'validation_middleware', body: req.body });
      return res.status(500).json({
        success: false,
        error: 'Erro interno de validação'
      });
    }
  };
};

/**
 * Validações específicas para endpoints
 */
const endpointValidations = {
  createFolder: {
    folderPath: [validators.isValidFilePath]
  },
  
  copyFile: {
    sourcePath: [validators.isValidFilePath],
    destinationPath: [validators.isValidFilePath]
  },
  
  executePowerShell: {
    command: [validators.isSecurePowerShellCommand],
    timeout: [
      (value) => value !== undefined ? validators.isValidTimeout(value) : 60000
    ]
  },
  
  checkFolder: {
    folderPath: [validators.isValidFilePath]
  }
};

/**
 * Função para sanitizar saída de comandos
 */
const sanitizeOutput = (output) => {
  if (typeof output !== 'string') {
    return output;
  }
  
  // Remover informações sensíveis comuns
  return output
    .replace(/password[\s=:]+[^\s\n]+/gi, 'password=***')
    .replace(/token[\s=:]+[^\s\n]+/gi, 'token=***')
    .replace(/key[\s=:]+[^\s\n]+/gi, 'key=***')
    .replace(/secret[\s=:]+[^\s\n]+/gi, 'secret=***');
};

export {
  ValidationError,
  validators,
  createValidationMiddleware,
  endpointValidations,
  sanitizeOutput
};

export default validators;