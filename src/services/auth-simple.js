// services/auth-simple.js
import { auth } from '../fb';

class SimpleAuthService {
  constructor() {
    this.tokenPromise = null;
  }

  async getToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ Obter token apenas quando necessário (lazy loading)
      return await user.getIdToken();
      
    } catch (error) {
      console.error('Erro ao obter token:', error);
      
      // Se for erro de bloqueio, tentar sem forçar refresh
      if (error.code === 'auth/requests-blocked') {
        console.warn('API bloqueada, tentando obter token cacheado...');
        const user = auth.currentUser;
        if (user) {
          return await user.getIdToken(false); // ✅ Não forçar refresh
        }
      }
      
      throw error;
    }
  }

  async secureFetch(url, options = {}) {
    try {
      const token = await this.getToken();
      
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(url, options);
      
      // Se token inválido, tentar renovar
      if (response.status === 401) {
        console.log('Token expirado, renovando...');
        const freshToken = await this.getToken();
        options.headers.Authorization = `Bearer ${freshToken}`;
        return await fetch(url, options);
      }
      
      return response;
      
    } catch (error) {
      console.error('Erro no secureFetch:', error);
      throw error;
    }
  }

  async isAuthenticated() {
    try {
      const user = auth.currentUser;
      return !!user;
    } catch {
      return false;
    }
  }
}

export const simpleAuthService = new SimpleAuthService();