'use client';

import { STATUS_LABEL, type Solicitacao, type StatusSolicitacao } from '@/shared/types/solicitacao';

const STATUS_BADGE: Record<StatusSolicitacao, string> = {
  ABERTA: 'text-bg-primary',
  EM_ANDAMENTO: 'text-bg-warning',
  CONCLUIDA: 'text-bg-success',
};

// formatação manual (sem fuso) para evitar divergência entre servidor e browser na hidratação
function formatarData(iso: string): string {
  const [data, hora = ''] = iso.split('T');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} ${hora.slice(0, 5)}`;
}

interface SolicitacaoTableProps {
  solicitacoes: Solicitacao[];
  podeEditar: boolean;
  podeExcluir: boolean;
  onEditar: (solicitacao: Solicitacao) => void;
  onExcluir: (solicitacao: Solicitacao) => void;
}

export default function SolicitacaoTable({ solicitacoes, podeEditar, podeExcluir, onEditar, onExcluir }: SolicitacaoTableProps) {
  return (
    <div className="card shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Título</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Criada em</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  Nenhuma solicitação nesta unidade.
                </td>
              </tr>
            )}
            {solicitacoes.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td className="fw-semibold">{s.titulo}</td>
                <td className="text-muted">{s.descricao}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td>{formatarData(s.dataCriacao)}</td>
                <td className="text-end text-nowrap">
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    disabled={!podeEditar}
                    title={podeEditar ? undefined : 'Sem permissão para editar'}
                    onClick={() => onEditar(s)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={!podeExcluir}
                    title={podeExcluir ? undefined : 'Sem permissão para excluir'}
                    onClick={() => onExcluir(s)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
