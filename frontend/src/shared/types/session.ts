export type Permissao = 'A' | 'B' | 'C' | 'D';

export const DESCRICAO_PERMISSAO: Record<Permissao, string> = {
  A: 'Visualizar',
  B: 'Criar',
  C: 'Editar',
  D: 'Excluir',
};

export interface UnidadeInfo {
  codigo: string;
  nome: string;
}

/** Corpo do token (cookie de sessão). */
export interface SessionClaims {
  codigoUsuario: number;
  nome: string;
  unidades: UnidadeInfo[];
  unidadeSelecionada: string;
  permissoes: Permissao[]; // permissões da unidade selecionada
}
