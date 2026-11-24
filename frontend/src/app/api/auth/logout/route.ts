import { NextResponse } from 'next/server';
import { limparSessao } from '@/bff/session';

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  limparSessao(resposta);
  return resposta;
}
