import { bffHttp } from '@/client/http/bff-http';
import type { HttpClient } from '@/client/http/http-client';
import type { SessionClaims } from '@/shared/types/session';

/** O cookie é httpOnly: o client nunca o lê, pede ao BFF que o decodifique. */
export class SessionApi {
  constructor(private readonly http: HttpClient) {}

  buscar(): Promise<SessionClaims> {
    return this.http.get<SessionClaims>('/session');
  }

  /** Renovação periódica: o BFF relê unidades/permissões no back e reemite o cookie (ou responde 401 se revogado). */
  renovar(): Promise<SessionClaims> {
    return this.http.post<SessionClaims>('/session/refresh');
  }

  /** O BFF busca as novas permissões e reemite o cookie. */
  trocarUnidade(codigoUnidade: string): Promise<SessionClaims> {
    return this.http.post<SessionClaims>('/session/unidade', { codigoUnidade });
  }
}

export const sessionApi = new SessionApi(bffHttp);
