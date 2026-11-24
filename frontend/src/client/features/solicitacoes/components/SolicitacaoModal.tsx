'use client';

import { useState, type FormEvent } from 'react';
import {
  STATUS_LABEL,
  type Solicitacao,
  type SolicitacaoInput,
  type StatusSolicitacao,
} from '@/shared/types/solicitacao';

interface SolicitacaoModalProps {
  solicitacao: Solicitacao | null; // null = criação
  salvando: boolean;
  erro: string | null;
  onSalvar: (dados: SolicitacaoInput) => void;
  onFechar: () => void;
}

export default function SolicitacaoModal({ solicitacao, salvando, erro, onSalvar, onFechar }: SolicitacaoModalProps) {
  const [titulo, setTitulo] = useState(solicitacao?.titulo ?? '');
  const [descricao, setDescricao] = useState(solicitacao?.descricao ?? '');
  const [status, setStatus] = useState<StatusSolicitacao>(solicitacao?.status ?? 'ABERTA');

  function enviar(e: FormEvent) {
    e.preventDefault();
    onSalvar({ titulo, descricao, status });
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <form className="modal-content" onSubmit={enviar}>
            <div className="modal-header">
              <h5 className="modal-title">{solicitacao ? `Editar solicitação #${solicitacao.id}` : 'Nova solicitação'}</h5>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onFechar} />
            </div>
            <div className="modal-body">
              {erro && <div className="alert alert-danger py-2">{erro}</div>}
              <div className="mb-3">
                <label className="form-label" htmlFor="titulo">Título</label>
                <input id="titulo" className="form-control" maxLength={255} value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="descricao">Descrição</label>
                <textarea id="descricao" className="form-control" rows={3} maxLength={1000} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="mb-1">
                <label className="form-label" htmlFor="status">Status</label>
                <select id="status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value as StatusSolicitacao)}>
                  {(Object.keys(STATUS_LABEL) as StatusSolicitacao[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onFechar} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
