import { NextRequest, NextResponse } from 'next/server';
import { buscarAcesso } from '@/bff/edge/policy';
import { COOKIE_NAME } from '@/bff/edge/session-config';
import { lerSessao } from '@/bff/edge/token';

function negar(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

/**
 * Porteiro do BFF: decodifica o cookie e valida a permissão exigida pela rota
 * ANTES de qualquer route handler ou server component executar.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessao = await lerSessao(req.cookies.get(COOKIE_NAME)?.value);

  // ---- Endpoints do BFF ----
  if (pathname.startsWith('/api/')) {
    const acesso = buscarAcesso(req.method, pathname);
    if (!acesso) return negar(403, 'Rota não permitida');
    if (acesso === 'publico') return NextResponse.next();
    if (!sessao) return negar(401, 'Sessão inválida ou expirada');
    if (acesso !== 'autenticado' && !sessao.permissoes.includes(acesso)) {
      return negar(403, `Sem permissão (${acesso}) na unidade ${sessao.unidadeSelecionada}`);
    }
    return NextResponse.next();
  }

  // ---- Páginas ----
  if (pathname === '/login') {
    return sessao ? NextResponse.redirect(new URL('/solicitacoes', req.url)) : NextResponse.next();
  }
  if (!sessao) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/solicitacoes/:path*', '/api/:path*'],
};
