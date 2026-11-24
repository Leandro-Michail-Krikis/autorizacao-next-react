import 'server-only';
import { cookies } from 'next/headers';
import { getBffUrl } from '@/bff/config';

/**
 * Usado pelos Server Components. Em vez de acessar dados diretamente, eles chamam
 * os endpoints do BFF via fetch (passando pelo middleware), repassando o cookie.
 */
export async function bffFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cookie = (await cookies()).toString();
  return fetch(`${getBffUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...(init.headers as Record<string, string> | undefined), cookie },
  });
}
