import { NextResponse } from 'next/server';
import { carregarPermissoes, carregarUnidades } from '@/bff/backend/backend-client';
import { erro } from '@/bff/http/respostas';
import { gravarSessao, limparSessao, obterSessao } from '@/bff/session';
import type { SessionClaims } from '@/shared/types/session';

/**
 * Renova a sessão: relê unidades e permissões no back e reemite o cookie com nova validade.
 *  - back indisponível (502): mantém a sessão atual; o client tenta de novo no próximo ciclo
 *  - usuário sem unidades (revogado): apaga o cookie e responde 401
 *  - unidade selecionada não existe mais: volta para a primeira disponível
 */
export async function POST() {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');

  const unidades = await carregarUnidades(sessao.codigoUsuario);
  if (!unidades) return erro(502, 'Não foi possível carregar as unidades');
  if (unidades.length === 0) {
    const revogada = erro(401, 'Acesso revogado');
    limparSessao(revogada);
    return revogada;
  }

  const unidadeSelecionada = unidades.some((u) => u.codigo === sessao.unidadeSelecionada)
    ? sessao.unidadeSelecionada
    : unidades[0].codigo;

  const permissoes = await carregarPermissoes(sessao.codigoUsuario, unidadeSelecionada);
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  const nova: SessionClaims = { ...sessao, unidades, unidadeSelecionada, permissoes };
  const resposta = NextResponse.json(nova, { headers: { 'Cache-Control': 'no-store' } });
  await gravarSessao(resposta, nova);
  return resposta;
}
