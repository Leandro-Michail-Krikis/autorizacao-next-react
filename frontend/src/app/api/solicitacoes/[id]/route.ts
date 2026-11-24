import { NextRequest } from 'next/server';
import { backendFetch } from '@/bff/backend/backend-client';
import { erro, responder } from '@/bff/http/respostas';
import { negarSemPermissao, obterSessao } from '@/bff/session';
import { validarSolicitacao } from '@/bff/validation/solicitacao';

type Contexto = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Contexto) {
  const { id } = await params;
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  const negado = negarSemPermissao(sessao, 'C');
  if (negado) return negado;
  if (!/^\d+$/.test(id)) return erro(400, 'Id inválido');

  const { dados, erro: msg } = validarSolicitacao(await req.json().catch(() => null));
  if (!dados) return erro(400, msg ?? 'Dados inválidos');

  const res = await backendFetch(`/api/solicitacoes/${id}`, {
    method: 'PUT',
    headers: { 'x-unidade-selecionada': sessao.unidadeSelecionada },
    body: JSON.stringify(dados),
  });
  return responder(res);
}

export async function DELETE(_req: NextRequest, { params }: Contexto) {
  const { id } = await params;
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  const negado = negarSemPermissao(sessao, 'D');
  if (negado) return negado;
  if (!/^\d+$/.test(id)) return erro(400, 'Id inválido');

  const res = await backendFetch(`/api/solicitacoes/${id}`, {
    method: 'DELETE',
    headers: { 'x-unidade-selecionada': sessao.unidadeSelecionada },
  });
  return responder(res);
}
