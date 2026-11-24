import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, carregarPermissoes, carregarUnidades } from '@/bff/backend/backend-client';
import { erro, responder } from '@/bff/http/respostas';
import { gravarSessao } from '@/bff/session';
import type { SessionClaims } from '@/shared/types/session';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.login || !body?.senha) return erro(400, 'Informe login e senha');

  // 1) back só confirma as credenciais
  const res = await backendFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: String(body.login), senha: String(body.senha) }),
  });
  if (!res.ok) return responder(res);
  const usuario = (await res.json()) as { codigoUsuario: number; nome: string };

  // 2) unidades disponíveis; na POC a selecionada é a primeira da lista
  const unidades = await carregarUnidades(usuario.codigoUsuario);
  if (!unidades) return erro(502, 'Não foi possível carregar as unidades');
  if (unidades.length === 0) return erro(403, 'Usuário sem unidades disponíveis');
  const unidadeSelecionada = unidades[0].codigo;

  // 3) permissões da unidade selecionada
  const permissoes = await carregarPermissoes(usuario.codigoUsuario, unidadeSelecionada);
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  // 4) monta o token e grava no cookie httpOnly
  const claims: SessionClaims = {
    codigoUsuario: usuario.codigoUsuario,
    nome: usuario.nome,
    unidades,
    unidadeSelecionada,
    permissoes,
  };
  const resposta = NextResponse.json({ ok: true });
  await gravarSessao(resposta, claims);
  return resposta;
}
