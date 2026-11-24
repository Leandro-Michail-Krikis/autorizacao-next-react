export type StatusSolicitacao = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

export interface Solicitacao {
  id: number;
  titulo: string;
  descricao: string | null;
  status: StatusSolicitacao;
  dataCriacao: string;
  codigoUnidade: string;
  nomeUnidade: string;
}

export interface SolicitacaoInput {
  titulo: string;
  descricao: string;
  status: StatusSolicitacao;
}
