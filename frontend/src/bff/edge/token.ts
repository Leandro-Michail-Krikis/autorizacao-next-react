import { SignJWT, jwtVerify } from 'jose';
import type { Permissao, SessionClaims, UnidadeInfo } from '@/shared/types/session';
import { SESSION_MAX_AGE, getSecretKey } from './session-config';

/** Gera o JWT assinado (HS256) com o corpo da sessão. */
export async function assinarSessao(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

/** Valida assinatura/expiração e devolve o corpo, ou null se inválido. Funciona no middleware (edge). */
export async function lerSessao(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    if (
      typeof payload.codigoUsuario !== 'number' ||
      typeof payload.unidadeSelecionada !== 'string' ||
      !Array.isArray(payload.unidades) ||
      !Array.isArray(payload.permissoes)
    ) {
      return null;
    }
    return {
      codigoUsuario: payload.codigoUsuario,
      nome: typeof payload.nome === 'string' ? payload.nome : '',
      unidades: payload.unidades as UnidadeInfo[],
      unidadeSelecionada: payload.unidadeSelecionada,
      permissoes: payload.permissoes as Permissao[],
    };
  } catch {
    return null;
  }
}
