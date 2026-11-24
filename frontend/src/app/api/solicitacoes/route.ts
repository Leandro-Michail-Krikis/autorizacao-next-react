import { NextRequest } from 'next/server';
import { backendFetch } from '@/bff/backend/backend-client';
import { erro, responder } from '@/bff/http/respostas';
import { negarSemPermissao, obterSessao } from '@/bff/session';
import { validarSolicitacao } from '@/bff/validation/solicitacao';

export async function GET() {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  const negado = negarSemPermissao(sessao, 'A');
  if (negado) return negado;

  // a unidade vem SEMPRE do token, nunca do client
  const res = await backendFetch(
    `/api/solicitacoes?codigoUnidade=${encodeURIComponent(sessao.unidadeSelecionada)}`,
  );
  return responder(res);
}

export async function POST(req: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  const negado = negarSemPermissao(sessao, 'B');
  if (negado) return negado;

  const { dados, erro: msg } = validarSolicitacao(await req.json().catch(() => null));
  if (!dados) return erro(400, msg ?? 'Dados inválidos');

  const res = await backendFetch('/api/solicitacoes', {
    method: 'POST',
    headers: { 'x-unidade-selecionada': sessao.unidadeSelecionada },
    body: JSON.stringify(dados),
  });
  return responder(res);
}
