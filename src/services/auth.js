// services/auth.js
import { auth } from '../fb'; // ✅ IMPORTAR O AUTH DO FIREBASE

class SecureAuthService {
  constructor() {
    this.tokenCache = null;
    this.lastRefresh = 0;
    this.REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
    this.requestQueue = [];
    this.isRefreshing = false;
  }

  // Obter token seguro (sempre fresco)
  async getSecureToken() {
    // Verificar se temos um token cacheado e ainda válido
    if (this.tokenCache && Date.now() - this.lastRefresh < 30000) { // 30 segundos
      return this.tokenCache;
    }

    try {
      const user = auth.currentUser; // ✅ AGORA auth ESTÁ DEFINIDO
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Forçar token fresco do Firebase
      this.tokenCache = await user.getIdToken(true);
      this.lastRefresh = Date.now();
      
      console.log('✅ Token renovado com sucesso');
      
      // Limpar cache após um tempo (segurança)
      setTimeout(() => {
        this.tokenCache = null;
      }, this.REFRESH_INTERVAL);

      return this.tokenCache;
      
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      this.tokenCache = null;
      throw error;
    }
  }

  // Fetch seguro com auto-refresh de token
  async secureFetch(url, options = {}) {
    // Gerar ID único para a requisição
    const requestId = this.generateRequestId();
    
    try {
      // Obter token fresco
      const token = await this.getSecureToken();
      
      // Configurar headers
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Request-ID': requestId,
        'X-Client-Type': 'web-app',
        'X-Client-Version': '1.0.0'
      };

      console.log(`🔐 Enviando requisição ${requestId} para:`, url);
      
      const response = await fetch(url, options);
      
      // Se token expirou, tentar renovar uma vez
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 Token expirado, tentando renovar...');
        
        // Limpar cache e tentar novamente
        this.tokenCache = null;
        const freshToken = await this.getSecureToken();
        
        options.headers.Authorization = `Bearer ${freshToken}`;
        return await fetch(url, options);
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erro na requisição ${requestId}:`, error);
      throw error;
    }
  }

  // Verificar se usuário está autenticado
  async isAuthenticated() {
    try {
      await this.getSecureToken();
      return true;
    } catch {
      return false;
    }
  }

  // Gerar ID único para rastreamento
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Limpar cache (logout)
  clearCache() {
    this.tokenCache = null;
    this.lastRefresh = 0;
  }
}

export const secureAuthService = new SecureAuthService();