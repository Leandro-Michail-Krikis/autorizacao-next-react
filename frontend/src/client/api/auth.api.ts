import { bffHttp } from '@/client/http/bff-http';
import type { HttpClient } from '@/client/http/http-client';

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  login(login: string, senha: string): Promise<void> {
    return this.http.post('/auth/login', { login, senha });
  }

  logout(): Promise<void> {
    return this.http.post('/auth/logout');
  }
}

export const authApi = new AuthApi(bffHttp);
