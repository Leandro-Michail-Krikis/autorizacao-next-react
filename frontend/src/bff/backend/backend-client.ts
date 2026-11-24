import 'server-only';
import { getBackendUrl } from '@/bff/config';
import type { Permissao, UnidadeInfo } from '@/shared/types/session';

/** Chamada ao back Spring Boot. Nunca roda no browser. */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    return new Response(JSON.stringify({ message: 'Back-end indisponível' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function carregarUnidades(codigoUsuario: number): Promise<UnidadeInfo[] | null> {
  const res = await backendFetch(`/api/usuarios/${codigoUsuario}/unidades`);
  if (!res.ok) return null;
  const data = (await res.json()) as { codigo: string; nome: string }[];
  return data.map((u) => ({ codigo: u.codigo, nome: u.nome }));
}

export async function carregarPermissoes(codigoUsuario: number, codigoUnidade: string): Promise<Permissao[] | null> {
  const res = await backendFetch(
    `/api/usuarios/${codigoUsuario}/unidades/${encodeURIComponent(codigoUnidade)}/permissoes`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { permissoes: { codigo: Permissao }[] };
  return data.permissoes.map((p) => p.codigo);
}
