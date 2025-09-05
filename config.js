/**
 * Configurações da API Externa
 * Monday Automation Server - Configuração para API https://api-createfoder.onrender.com
 */

export const API_CONFIG = {
  // URL base da API externa
  BASE_URL: 'https://api-createfoder.onrender.com',
  
  // Endpoints disponíveis
  ENDPOINTS: {
    CREATE_FOLDER: '/api/create-folder',
    COPY_FILE: '/api/copy-file',
    EXECUTE_POWERSHELL: '/api/execute-powershell',
    CHECK_FOLDER: '/api/check-folder',
    STATUS: '/api/status'
  },
  
  // Configurações de timeout e retry
  TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'User-Agent': 'Monday-Automation-Client/1.0.0'
  }
};

/**
 * Função helper para fazer requisições à API externa
 */
export async function makeAPIRequest(endpoint, data = null, method = 'GET') {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: API_CONFIG.DEFAULT_HEADERS,
    timeout: API_CONFIG.TIMEOUT
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  let lastError;
  
  // Implementar retry logic
  for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`API Error ${response.status}: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      if (attempt < API_CONFIG.MAX_RETRIES) {
        console.log(`Tentativa ${attempt} falhou, tentando novamente em ${API_CONFIG.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw lastError;
}

export default API_CONFIG;