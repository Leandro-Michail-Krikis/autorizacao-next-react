'use client';

interface SolicitacaoToolbarProps {
  titulo: string;
  podeCriar: boolean;
  onCriar: () => void;
}

export default function SolicitacaoToolbar({ titulo, podeCriar, onCriar }: SolicitacaoToolbarProps) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h2 className="h4 mb-0">{titulo}</h2>
      <button
        className="btn btn-primary"
        disabled={!podeCriar}
        title={podeCriar ? undefined : 'Sem permissão para criar'}
        onClick={onCriar}
      >
        + Criar solicitação
      </button>
    </div>
  );
}
