import { NextResponse } from 'next/server';
import { erro } from '@/bff/http/respostas';
import { obterSessao } from '@/bff/session';

/** Decodifica o cookie e devolve o corpo do token ao client (session manager). */
export async function GET() {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  return NextResponse.json(sessao, { headers: { 'Cache-Control': 'no-store' } });
}
