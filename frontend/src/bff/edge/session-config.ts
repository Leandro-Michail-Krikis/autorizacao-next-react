export const COOKIE_NAME = 'session';
/**
 * Vida do cookie/JWT, em segundos. Curta de propósito: o client renova a sessão a cada 5 minutos
 * (POST /api/session/refresh), relendo unidades e permissões no back. Sem renovação (aba fechada,
 * usuário inativo) a sessão morre em 15 min, e uma permissão revogada vale no máximo ~5 min.
 */
export const SESSION_MAX_AGE = 60 * 15;

export function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET precisa ter no mínimo 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}
