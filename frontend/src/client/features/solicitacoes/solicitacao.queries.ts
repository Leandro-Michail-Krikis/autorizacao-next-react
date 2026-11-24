import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { solicitacaoApi } from '@/client/api/solicitacao.api';
import { chaves } from '@/client/core/query-keys';
import type { Solicitacao, SolicitacaoInput } from '@/shared/types/solicitacao';

interface OpcoesListagem {
  habilitado: boolean;
  initialData?: Solicitacao[];
}

export function useSolicitacoes(unidade: string | null, { habilitado, initialData }: OpcoesListagem) {
  return useQuery({
    queryKey: chaves.solicitacoes(unidade ?? ''),
    queryFn: () => solicitacaoApi.listar(),
    enabled: !!unidade && habilitado,
    initialData,
  });
}

export function useSolicitacaoMutations(unidade: string | null) {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: chaves.solicitacoes(unidade ?? '') });

  const criar = useMutation<void, Error, SolicitacaoInput>({
    mutationFn: (dados) => solicitacaoApi.criar(dados),
    onSuccess: invalidar,
  });

  const editar = useMutation<void, Error, { id: number; dados: SolicitacaoInput }>({
    mutationFn: ({ id, dados }) => solicitacaoApi.editar(id, dados),
    onSuccess: invalidar,
  });

  const excluir = useMutation<void, Error, number>({
    mutationFn: (id) => solicitacaoApi.excluir(id),
    onSuccess: invalidar,
  });

  return { criar, editar, excluir };
}
