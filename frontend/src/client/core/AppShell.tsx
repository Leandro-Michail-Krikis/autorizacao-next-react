'use client';

import Header from '@/client/ui/layout/Header';
import { useSession } from './SessionProvider';

/** Container do layout autenticado: lê a sessão e entrega tudo ao Header via props. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { session, unidadeAtual, trocarUnidade, trocandoUnidade, erroTrocaUnidade, sair } = useSession();

  return (
    <>
      <Header
        nome={session?.nome ?? null}
        unidades={session?.unidades ?? []}
        unidadeAtual={unidadeAtual}
        trocandoUnidade={trocandoUnidade}
        erroTrocaUnidade={erroTrocaUnidade}
        onTrocarUnidade={trocarUnidade}
        onSair={sair}
      />
      <main className="container py-4">{children}</main>
    </>
  );
}
