import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, SESSION_MAX_AGE } from '@/bff/edge/session-config';
import { assinarSessao, lerSessao } from '@/bff/edge/token';
import type { Permissao, SessionClaims } from '@/shared/types/session';

/** Lê e valida o cookie da requisição atual. */
export async function obterSessao(): Promise<SessionClaims | null> {
  const store = await cookies();
  return lerSessao(store.get(COOKIE_NAME)?.value);
}

/** Grava (ou renova) o cookie de sessão na resposta. */
export async function gravarSessao(res: NextResponse, claims: SessionClaims): Promise<void> {
  res.cookies.set(COOKIE_NAME, await assinarSessao(claims), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function limparSessao(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Defesa em profundidade: o middleware já checa, o handler confere de novo. */
export function negarSemPermissao(sessao: SessionClaims, permissao: Permissao): NextResponse | null {
  return sessao.permissoes.includes(permissao)
    ? null
    : NextResponse.json({ message: `Sem permissão (${permissao})` }, { status: 403 });
}
