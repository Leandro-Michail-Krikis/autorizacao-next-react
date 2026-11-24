import { NextRequest, NextResponse } from 'next/server';
import { carregarPermissoes } from '@/bff/backend/backend-client';
import { erro } from '@/bff/http/respostas';
import { gravarSessao, obterSessao } from '@/bff/session';
import type { SessionClaims } from '@/shared/types/session';

/** Troca a unidade logada: busca as novas permissões no back e reemite o cookie. */
export async function POST(req: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');

  const body = await req.json().catch(() => null);
  const codigoUnidade = typeof body?.codigoUnidade === 'string' ? body.codigoUnidade : '';

  // só aceita unidades que já estão no token assinado
  if (!sessao.unidades.some((u) => u.codigo === codigoUnidade)) {
    return erro(403, 'Unidade não disponível para este usuário');
  }

  const permissoes = await carregarPermissoes(sessao.codigoUsuario, codigoUnidade);
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  const nova: SessionClaims = { ...sessao, unidadeSelecionada: codigoUnidade, permissoes };
  const resposta = NextResponse.json(nova, { headers: { 'Cache-Control': 'no-store' } });
  await gravarSessao(resposta, nova);
  return resposta;
}
