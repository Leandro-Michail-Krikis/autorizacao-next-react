'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { authApi } from '@/client/api/auth.api';
import { sessionApi } from '@/client/api/session.api';
import type { Permissao, SessionClaims, UnidadeInfo } from '@/shared/types/session';
import { chaves } from './query-keys';

interface SessionContextValue {
  session: SessionClaims | null;
  loading: boolean;
  unidadeAtual: UnidadeInfo | null;
  /** Apenas para controle de UI (habilitar/desabilitar). A segurança real está no BFF. */
  can: (permissao: Permissao) => boolean;
  trocarUnidade: (codigoUnidade: string) => void;
  trocandoUnidade: boolean;
  erroTrocaUnidade: string | null;
  sair: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** De quanto em quanto tempo a sessão é renovada (o cookie dura 15 min; ver SESSION_MAX_AGE no BFF). */
const INTERVALO_RENOVACAO_MS = 5 * 60_000;

/**
 * Session manager do client. Pede ao BFF a decodificação do cookie (que é httpOnly)
 * e expõe sessão, permissões e ações de sessão para o resto do front.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: chaves.sessao,
    queryFn: () => sessionApi.buscar(),
    staleTime: 5 * 60_000,
  });
  const session = consulta.data ?? null;

  const troca = useMutation<SessionClaims, Error, string>({
    mutationFn: (codigoUnidade) => sessionApi.trocarUnidade(codigoUnidade),
    // o BFF já reemitiu o cookie; atualizar a sessão muda a chave e dispara a busca da nova unidade
    onSuccess: (nova) => queryClient.setQueryData(chaves.sessao, nova),
  });

  // Renovação: o BFF relê unidades e permissões no back e reemite o cookie. Se o usuário foi
  // revogado o BFF responde 401 e o bffHttp redireciona para /login. Falha de rede/502 é ignorada:
  // a sessão atual segue valendo e a próxima tentativa acontece em 5 min.
  const renovacao = useMutation<SessionClaims, Error, void>({
    mutationFn: () => sessionApi.renovar(),
    onSuccess: (nova) => queryClient.setQueryData(chaves.sessao, nova),
  });
  const renovar = renovacao.mutate;
  const logada = session !== null;
  const trocaEmAndamento = useRef(false);
  trocaEmAndamento.current = troca.isPending;

  useEffect(() => {
    if (!logada) return;
    const id = setInterval(() => {
      // não renova durante a troca de unidade: a resposta antiga sobrescreveria o cookie novo
      if (!trocaEmAndamento.current) renovar();
    }, INTERVALO_RENOVACAO_MS);
    return () => clearInterval(id);
  }, [logada, renovar]);

  const saida = useMutation<void, Error, void>({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });

  const can = useCallback((p: Permissao) => !!session?.permissoes.includes(p), [session]);
  const trocarUnidade = useCallback((codigo: string) => troca.mutate(codigo), [troca.mutate]);
  const sair = useCallback(() => saida.mutate(), [saida.mutate]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      loading: consulta.isPending,
      unidadeAtual: session?.unidades.find((u) => u.codigo === session.unidadeSelecionada) ?? null,
      can,
      trocarUnidade,
      trocandoUnidade: troca.isPending,
      erroTrocaUnidade: troca.error?.message ?? null,
      sair,
    }),
    [session, consulta.isPending, can, trocarUnidade, troca.isPending, troca.error, sair],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve ser usado dentro de <SessionProvider>');
  return ctx;
}
