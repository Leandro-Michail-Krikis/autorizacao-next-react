import type { Permissao } from '../../shared/types/session';

/**
 * Política de acesso do BFF (default-deny): rota que não está aqui é bloqueada.
 *  - 'publico'     : não exige sessão
 *  - 'autenticado' : exige sessão válida
 *  - 'A'..'D'      : exige sessão válida + essa permissão na unidade selecionada
 */
export type Acesso = 'publico' | 'autenticado' | Permissao;

export interface Regra {
  metodo: string;
  caminho: RegExp;
  acesso: Acesso;
}

export const REGRAS: Regra[] = [
  { metodo: 'POST', caminho: /^\/api\/auth\/login$/, acesso: 'publico' },
  { metodo: 'POST', caminho: /^\/api\/auth\/logout$/, acesso: 'publico' },
  { metodo: 'GET', caminho: /^\/api\/session$/, acesso: 'autenticado' },
  { metodo: 'POST', caminho: /^\/api\/session\/unidade$/, acesso: 'autenticado' },
  { metodo: 'POST', caminho: /^\/api\/session\/refresh$/, acesso: 'autenticado' },
  { metodo: 'GET', caminho: /^\/api\/solicitacoes$/, acesso: 'A' },
  { metodo: 'POST', caminho: /^\/api\/solicitacoes$/, acesso: 'B' },
  { metodo: 'PUT', caminho: /^\/api\/solicitacoes\/\d+$/, acesso: 'C' },
  { metodo: 'DELETE', caminho: /^\/api\/solicitacoes\/\d+$/, acesso: 'D' },
];

export function buscarAcesso(metodo: string, caminho: string): Acesso | undefined {
  return REGRAS.find((r) => r.metodo === metodo && r.caminho.test(caminho))?.acesso;
}
