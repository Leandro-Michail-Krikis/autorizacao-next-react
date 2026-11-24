import { HttpClient } from './http-client';

/** Instância única usada por todas as classes de API do client. */
export const bffHttp = new HttpClient({
  baseURL: '/api',
  aoSessaoExpirada: () => {
    // na própria tela de login um 401 significa "credenciais inválidas": não redireciona
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});
