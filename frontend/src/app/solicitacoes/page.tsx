import { redirect } from 'next/navigation';
import { bffFetch } from '@/bff/ssr/bff-fetch';
import SolicitacoesContainer from '@/client/features/solicitacoes/SolicitacoesContainer';
import type { SessionClaims } from '@/shared/types/session';
import type { Solicitacao } from '@/shared/types/solicitacao';

export const dynamic = 'force-dynamic';

/**
 * Server Component (SSR): busca a primeira carga SEMPRE via endpoints do BFF (passam pelo middleware)
 * e entrega ao container client, que passa a controlar os dados com React Query.
 * Se algo falhar aqui, o container tenta de novo no client; a decisão de autorização continua no BFF.
 */
export default async function SolicitacoesPage() {
  let naoAutenticado = false;
  let initialData: Solicitacao[] | undefined;
  let initialUnidade: string | undefined;

  try {
    const [resLista, resSessao] = await Promise.all([bffFetch('/api/solicitacoes'), bffFetch('/api/session')]);
    naoAutenticado = resLista.status === 401 || resSessao.status === 401;
    if (resLista.ok) initialData = (await resLista.json()) as Solicitacao[];
    if (resSessao.ok) initialUnidade = ((await resSessao.json()) as SessionClaims).unidadeSelecionada;
  } catch {
    // sem dados iniciais: o client busca
  }

  if (naoAutenticado) redirect('/login');
  if (!initialUnidade) initialData = undefined; // só usa a lista se soubermos de qual unidade ela é

  return <SolicitacoesContainer initialData={initialData} initialUnidade={initialUnidade} />;
}
