'use client';

import { useState } from 'react';
import { useSession } from '@/client/core/SessionProvider';
import type { Solicitacao, SolicitacaoInput } from '@/shared/types/solicitacao';
import SolicitacaoModal from './components/SolicitacaoModal';
import SolicitacaoTable from './components/SolicitacaoTable';
import SolicitacaoToolbar from './components/SolicitacaoToolbar';
import { useSolicitacaoMutations, useSolicitacoes } from './solicitacao.queries';

interface SolicitacoesContainerProps {
  /** Lista já buscada no servidor (SSR via BFF) para a primeira renderização. */
  initialData?: Solicitacao[];
  /** Unidade a que `initialData` pertence. */
  initialUnidade?: string;
}

type EstadoModal = { aberto: false } | { aberto: true; solicitacao: Solicitacao | null };

/**
 * PAI da tela: é o único que fala com o React Query / API.
 * Os componentes filhos são apresentacionais e recebem tudo por props.
 */
export default function SolicitacoesContainer({ initialData, initialUnidade }: SolicitacoesContainerProps) {
  const { session, loading: carregandoSessao, unidadeAtual, can } = useSession();
  const unidade = session?.unidadeSelecionada ?? initialUnidade ?? null;
  const podeVisualizar = can('A');

  const consulta = useSolicitacoes(unidade, {
    habilitado: podeVisualizar,
    initialData: unidade === initialUnidade ? initialData : undefined,
  });
  const { criar, editar, excluir } = useSolicitacaoMutations(unidade);
  const [modal, setModal] = useState<EstadoModal>({ aberto: false });

  function abrirModal(solicitacao: Solicitacao | null) {
    criar.reset();
    editar.reset();
    setModal({ aberto: true, solicitacao });
  }

  function fecharModal() {
    setModal({ aberto: false });
  }

  function salvar(dados: SolicitacaoInput) {
    if (!modal.aberto) return;
    const aoConcluir = { onSuccess: fecharModal };
    if (modal.solicitacao) editar.mutate({ id: modal.solicitacao.id, dados }, aoConcluir);
    else criar.mutate(dados, aoConcluir);
  }

  function excluirComConfirmacao(s: Solicitacao) {
    if (!window.confirm(`Excluir a solicitação "${s.titulo}"?`)) return;
    excluir.mutate(s.id);
  }

  if (!carregandoSessao && !podeVisualizar) {
    return (
      <div className="alert alert-warning">
        Você não tem permissão para visualizar as solicitações desta unidade. Troque de unidade no menu superior.
      </div>
    );
  }

  const titulo = unidadeAtual ? `Solicitações — ${unidadeAtual.nome} (${unidadeAtual.codigo})` : 'Solicitações';

  return (
    <>
      <SolicitacaoToolbar titulo={titulo} podeCriar={can('B')} onCriar={() => abrirModal(null)} />

      {excluir.error && <div className="alert alert-danger py-2">{excluir.error.message}</div>}
      {consulta.isError && <div className="alert alert-danger py-2">{consulta.error.message}</div>}

      {consulta.data === undefined && !consulta.isError ? (
        <div className="text-center text-muted py-5">Carregando...</div>
      ) : (
        <SolicitacaoTable
          solicitacoes={consulta.data ?? []}
          podeEditar={can('C')}
          podeExcluir={can('D')}
          onEditar={abrirModal}
          onExcluir={excluirComConfirmacao}
        />
      )}

      {modal.aberto && (
        <SolicitacaoModal
          key={modal.solicitacao?.id ?? 'nova'}
          solicitacao={modal.solicitacao}
          salvando={criar.isPending || editar.isPending}
          erro={(criar.error ?? editar.error)?.message ?? null}
          onSalvar={salvar}
          onFechar={fecharModal}
        />
      )}
    </>
  );
}
