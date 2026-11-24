import 'server-only';
import { NextResponse } from 'next/server';

export function erro(status: number, message: string): NextResponse {
  return NextResponse.json({ message }, { status });
}

/** Repassa a resposta do back ao client, normalizando erros em { message }. */
export async function responder(res: Response): Promise<NextResponse> {
  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const texto = await res.text();
  if (!res.ok) {
    let message = 'Erro ao processar a requisição';
    try {
      const json = JSON.parse(texto);
      if (json?.message) message = String(json.message);
    } catch {
      // corpo não era JSON; mantém a mensagem padrão
    }
    return erro(res.status, message);
  }
  return new NextResponse(texto, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
