# Autenticação e autorização com BFF no Next.js — guia de implementação

Guia passo a passo para reproduzir em outros projetos front (Next.js, App Router) a estrutura usada na POC de Solicitações.
O diagrama visual está em `arquitetura-auth-bff.excalidraw` (abrir em excalidraw.com).
O foco é a **ideia e a responsabilidade de cada arquivo**. As chamadas ao back-end aparecem de forma genérica
(ex.: "buscar permissões"); troque pelos endpoints reais de cada projeto.

---

## 1. A ideia em uma página

```
Browser ──> Next.js (middleware + route handlers = BFF) ──> Back-end (sem autorização própria)
            cookie httpOnly com JWT assinado
```

- O **browser nunca fala com o back** e nunca enxerga o token (cookie `httpOnly`).
- O **BFF (Next.js, lado servidor) é o único que autentica, autoriza e conhece o back**.
- A sessão é um **JWT assinado (HS256)** dentro de um cookie. Ele carrega: quem é o usuário, as unidades
  disponíveis, a unidade selecionada e as permissões **dessa** unidade.
- A **unidade nunca vem do client**: sempre sai do token e é repassada ao back pelo BFF.
- A autorização é em **duas camadas** (defesa em profundidade): o middleware barra antes de qualquer código;
  cada handler confere de novo.
- A política de acesso é **default-deny**: rota que não está declarada é bloqueada.
- A sessão é **curta (15 min) e renovada a cada 5 min** pelo client, relendo as permissões no back.
  Assim, uma permissão retirada deixa de valer em poucos minutos.

---

## 2. Estrutura de pastas: organizada por ONDE o código executa

```
src/
  shared/              roda nos dois lados. Só tipos e constantes puras.
    types/
      session.ts
  client/              SÓ browser. Nunca importa bff/.
    http/
      http-client.ts
      bff-http.ts
      api-error.ts
    api/
      auth.api.ts
      session.api.ts
      <recurso>.api.ts
    core/
      SessionProvider.tsx
      QueryProvider.tsx
      query-keys.ts
    ui/                componentes genéricos, só props
    features/<tela>/   Container (pai) + components/ (filhos, só props)
  bff/                 SÓ servidor. Nunca importa client/.
    edge/              módulos que o middleware (runtime edge) também usa
      policy.ts
      session-config.ts
      token.ts
    session.ts
    config.ts
    backend/
      backend-client.ts
    http/
      respostas.ts
    ssr/
      bff-fetch.ts
    validation/
  app/
    api/**/route.ts    endpoints do BFF (finos)
    **/page.tsx        server components (SSR)
  middleware.ts        porteiro (o Next exige essa posição)
architecture/          testes que garantem as regras acima
```

Direção permitida das dependências (setas só para a direita):

```
shared  <-  client
shared  <-  bff/edge  <-  bff  <-  app/api
shared  <-  app/pages  (-> client com "use client", -> bff/ssr)
middleware -> bff/edge, shared
```

Por que dividir assim: o código do client e o do servidor **nunca se misturam por acidente** (segredo vazando para o
bundle do browser, `axios` rodando no servidor, etc.). O teste de arquitetura (passo 12) faz essa regra valer sempre.

---

## 3. Responsabilidade de cada arquivo

### shared/
| Arquivo | Responsabilidade |
|---|---|
| `shared/types/session.ts` | Tipos e constantes comuns: `Permissao`, `UnidadeInfo`, `SessionClaims` (corpo do token). Sem `env`, sem I/O, sem import externo. |

### bff/edge/ (roda também no middleware)
| Arquivo | Responsabilidade |
|---|---|
| `bff/edge/session-config.ts` | Nome do cookie, tempo de vida da sessão (ex.: 15 min) e leitura do segredo (`SESSION_SECRET`, mínimo 32 caracteres). Falha alto se o segredo não existir ou for o valor de exemplo. |
| `bff/edge/token.ts` | `assinarSessao(claims)` gera o JWT HS256; `lerSessao(token)` valida assinatura e expiração e devolve os claims ou `null`. Usa `jose`, que funciona no edge. |
| `bff/edge/policy.ts` | **Política de acesso, default-deny.** Lista de regras `{ método, caminho, acesso }`. `acesso` é `publico`, `autenticado` ou uma permissão. Função `buscarAcesso(método, caminho)`. |

### bff/ (só servidor, todos começam com `import 'server-only'`)
| Arquivo | Responsabilidade |
|---|---|
| `bff/config.ts` | Lê URLs de ambiente (URL do back, URL interna do próprio Next). |
| `bff/session.ts` | Ponte entre cookie e claims: `obterSessao()` (lê o cookie da requisição), `gravarSessao()` (grava/renova o cookie httpOnly, sameSite, secure), `limparSessao()`, `negarSemPermissao()` (checagem do handler). |
| `bff/backend/backend-client.ts` | Único lugar que fala com o back: `backendFetch` (com tratamento de back fora do ar → 502) e funções de negócio de acesso: confirmar credenciais, carregar unidades, carregar permissões. |
| `bff/http/respostas.ts` | Padroniza respostas: `erro(status, msg)` e `responder(resposta do back)` normalizando erros em `{ message }`. |
| `bff/validation/*.ts` | Validação dos corpos recebidos do client antes de chamar o back. |
| `bff/ssr/bff-fetch.ts` | Usado pelos Server Components: chama os próprios endpoints do BFF repassando o cookie, para que a leitura também passe pelo middleware e pela policy. |

### app/
| Arquivo | Responsabilidade |
|---|---|
| `middleware.ts` | Porteiro. Lê o cookie, consulta a policy e responde 401/403 ou deixa passar. Redireciona páginas para `/login` sem sessão. O `matcher` precisa listar toda rota nova. |
| `app/api/auth/login/route.ts` | Público. Confirma credenciais no back, carrega unidades e permissões, monta o token e grava o cookie. |
| `app/api/auth/logout/route.ts` | Público. Apaga o cookie. |
| `app/api/session/route.ts` | Autenticado. Decodifica o cookie e devolve os claims ao client (o cookie é httpOnly, então o client não consegue ler). |
| `app/api/session/unidade/route.ts` | Autenticado. Troca a unidade selecionada: só aceita unidades que já estão no token, recarrega permissões e reemite o cookie. |
| `app/api/session/refresh/route.ts` | Autenticado. Renovação periódica: relê unidades e permissões no back e reemite o cookie. |
| `app/api/<recurso>/route.ts` | Endpoints de negócio, finos: sessão + permissão + chamada ao back com a unidade do token. |
| `app/**/page.tsx` | Server Components. Buscam a primeira carga via `bffFetch` e entregam ao container como `initialData`. |
| `app/login/page.tsx` | Tela de login, sem exigir sessão. |

### client/
| Arquivo | Responsabilidade |
|---|---|
| `client/http/http-client.ts` | Classe utilitária sobre o axios: JSON por padrão, todo erro vira `ApiError` com a mensagem do BFF, 401 dispara o callback de sessão expirada. |
| `client/http/bff-http.ts` | Instância única com `baseURL: '/api'`. Sempre relativa: o browser só enxerga o próprio Next. O callback de 401 redireciona para `/login` (exceto na própria tela de login). |
| `client/http/api-error.ts` | Erro tipado com status e mensagem. |
| `client/api/auth.api.ts` | `login`, `logout`. |
| `client/api/session.api.ts` | `buscar`, `trocarUnidade`, `renovar`. |
| `client/api/<recurso>.api.ts` | Uma classe por recurso de negócio. |
| `client/core/SessionProvider.tsx` | **Session manager do client.** Pede a sessão ao BFF, expõe `session`, `unidadeAtual`, `can(permissao)` (só para UI), `trocarUnidade`, `sair` e **dispara a renovação a cada 5 min**. |
| `client/core/QueryProvider.tsx` | Provider do React Query. |
| `client/core/query-keys.ts` | Chaves do cache. A unidade faz parte da chave dos dados de negócio: cada unidade tem o seu cache. |
| `client/features/<tela>/*Container.tsx` | Componente pai: único que fala com a API (via React Query). |
| `client/features/<tela>/components/*` e `client/ui/*` | Filhos e componentes genéricos: só recebem props, não fazem requisição. |

---

## 4. Passo a passo (com código de exemplo)

Os trechos são TypeScript e mostram a **forma**; os nomes entre `<...>` e as funções `buscarUnidades`/`buscarPermissoes`
são placeholders para os endpoints reais do seu back. O diagrama completo está em `arquitetura-auth-bff.excalidraw`.

### Passo 1 — Defina o corpo do token (`shared/types/session.ts`)
Decida o que a sessão carrega. Só o necessário para decidir acesso e montar a UI; nada sensível. `permissoes` são as da
unidade selecionada, não de todas.

```ts
// shared/types/session.ts  (sem env, sem I/O, sem imports externos)
export type Permissao = 'A' | 'B' | 'C' | 'D'; // troque pelo conjunto do seu domínio

export interface UnidadeInfo {
  codigo: string;
  nome: string;
}

/** Corpo do token (cookie de sessão). */
export interface SessionClaims {
  codigoUsuario: number;
  nome: string;
  unidades: UnidadeInfo[];
  unidadeSelecionada: string;
  permissoes: Permissao[]; // da unidade selecionada
}
```

### Passo 2 — Configure sessão e segredo (`bff/edge/session-config.ts`)
Tempo de vida **curto**; o segredo é obrigatório e o valor de exemplo é recusado.

```ts
export const COOKIE_NAME = 'session';
export const SESSION_MAX_AGE = 60 * 15; // 15 min, em segundos (o client renova a cada 5 min)

export function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('troque-por')) {
    throw new Error('SESSION_SECRET ausente, curto (<32) ou ainda é o valor de exemplo');
  }
  return new TextEncoder().encode(secret);
}
```

### Passo 3 — Assine e valide o token (`bff/edge/token.ts`)
Só `jose` (funciona no edge). A leitura devolve `null` em qualquer falha **de token**; erro de configuração do segredo
não é engolido (senão todo mundo vira "sessão inválida" sem explicação).

```ts
import { SignJWT, jwtVerify } from 'jose';
import type { Permissao, SessionClaims, UnidadeInfo } from '@/shared/types/session';
import { SESSION_MAX_AGE, getSecretKey } from './session-config';

export async function assinarSessao(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

export async function lerSessao(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  const chave = getSecretKey(); // fora do try: erro de configuração aparece
  try {
    const { payload } = await jwtVerify(token, chave, { algorithms: ['HS256'] }); // algoritmo fixado
    if (
      typeof payload.codigoUsuario !== 'number' ||
      typeof payload.unidadeSelecionada !== 'string' ||
      !Array.isArray(payload.unidades) ||
      !Array.isArray(payload.permissoes)
    ) {
      return null;
    }
    return {
      codigoUsuario: payload.codigoUsuario,
      nome: typeof payload.nome === 'string' ? payload.nome : '',
      unidades: payload.unidades as UnidadeInfo[],
      unidadeSelecionada: payload.unidadeSelecionada,
      permissoes: payload.permissoes as Permissao[],
    };
  } catch {
    return null; // assinatura inválida, expirado, malformado...
  }
}
```

### Passo 4 — Declare a política de acesso (`bff/edge/policy.ts`)
Uma tabela com método, caminho e nível de acesso. **Default-deny**: o que não está aqui é 403. Só login e logout são públicos.

```ts
import type { Permissao } from '@/shared/types/session';

export type Acesso = 'publico' | 'autenticado' | Permissao;
export interface Regra { metodo: string; caminho: RegExp; acesso: Acesso }

export const REGRAS: Regra[] = [
  { metodo: 'POST',   caminho: /^\/api\/auth\/login$/,       acesso: 'publico' },
  { metodo: 'POST',   caminho: /^\/api\/auth\/logout$/,      acesso: 'publico' },
  { metodo: 'GET',    caminho: /^\/api\/session$/,           acesso: 'autenticado' },
  { metodo: 'POST',   caminho: /^\/api\/session\/unidade$/,  acesso: 'autenticado' },
  { metodo: 'POST',   caminho: /^\/api\/session\/refresh$/,  acesso: 'autenticado' },
  { metodo: 'GET',    caminho: /^\/api\/<recurso>$/,         acesso: 'A' },
  { metodo: 'POST',   caminho: /^\/api\/<recurso>$/,         acesso: 'B' },
  { metodo: 'PUT',    caminho: /^\/api\/<recurso>\/\d+$/,    acesso: 'C' },
  { metodo: 'DELETE', caminho: /^\/api\/<recurso>\/\d+$/,    acesso: 'D' },
];

export function buscarAcesso(metodo: string, caminho: string): Acesso | undefined {
  return REGRAS.find((r) => r.metodo === metodo && r.caminho.test(caminho))?.acesso;
}
```

### Passo 5 — Crie o porteiro (`middleware.ts`)
Roda antes de qualquer handler ou página. Toda página protegida precisa estar no `matcher`.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { buscarAcesso } from '@/bff/edge/policy';
import { COOKIE_NAME } from '@/bff/edge/session-config';
import { lerSessao } from '@/bff/edge/token';

const negar = (status: number, message: string) => NextResponse.json({ message }, { status });

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessao = await lerSessao(req.cookies.get(COOKIE_NAME)?.value);

  if (pathname.startsWith('/api/')) {
    const acesso = buscarAcesso(req.method, pathname);
    if (!acesso) return negar(403, 'Rota não permitida');               // default-deny
    if (acesso === 'publico') return NextResponse.next();
    if (!sessao) return negar(401, 'Sessão inválida ou expirada');
    if (acesso !== 'autenticado' && !sessao.permissoes.includes(acesso)) {
      return negar(403, `Sem permissão (${acesso})`);
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    return sessao ? NextResponse.redirect(new URL('/<home>', req.url)) : NextResponse.next();
  }
  return sessao ? NextResponse.next() : NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/login', '/<area-logada>/:path*', '/api/:path*'] };
```

### Passo 6 — Isole o acesso ao back (`bff/backend/backend-client.ts`)
Um único ponto de saída para o back. O back só **informa** (credenciais válidas? quais unidades? quais permissões?);
quem decide é o BFF.

```ts
import 'server-only';
import { getBackendUrl } from '@/bff/config';
import type { Permissao, UnidadeInfo } from '@/shared/types/session';

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) },
    });
  } catch {
    // back fora do ar: resposta padronizada em vez de estourar exceção
    return new Response(JSON.stringify({ message: 'Back-end indisponível' }), { status: 502 });
  }
}

export async function buscarUnidades(codigoUsuario: number): Promise<UnidadeInfo[] | null> {
  const res = await backendFetch('<endpoint de unidades do usuário>');
  if (!res.ok) return null;
  return (await res.json()).map((u: UnidadeInfo) => ({ codigo: u.codigo, nome: u.nome }));
}

export async function buscarPermissoes(codigoUsuario: number, unidade: string): Promise<Permissao[] | null> {
  const res = await backendFetch('<endpoint de permissões do usuário na unidade>');
  if (!res.ok) return null;
  return (await res.json()).permissoes.map((p: { codigo: Permissao }) => p.codigo);
}
```

### Passo 7 — Ponte cookie ↔ claims (`bff/session.ts`)

```ts
import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, SESSION_MAX_AGE } from '@/bff/edge/session-config';
import { assinarSessao, lerSessao } from '@/bff/edge/token';
import type { Permissao, SessionClaims } from '@/shared/types/session';

export async function obterSessao(): Promise<SessionClaims | null> {
  return lerSessao((await cookies()).get(COOKIE_NAME)?.value);
}

export async function gravarSessao(res: NextResponse, claims: SessionClaims): Promise<void> {
  res.cookies.set(COOKIE_NAME, await assinarSessao(claims), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function limparSessao(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

/** 2ª camada de defesa: o handler confere de novo o que o middleware já checou. */
export function negarSemPermissao(sessao: SessionClaims, permissao: Permissao): NextResponse | null {
  return sessao.permissoes.includes(permissao)
    ? null
    : NextResponse.json({ message: `Sem permissão (${permissao})` }, { status: 403 });
}
```

### Passo 8 — Endpoints de sessão (`app/api/auth/*` e `app/api/session/*`)

**Login** (público): confirma credenciais, carrega unidades e permissões, grava o cookie.

```ts
// app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.login || !body?.senha) return erro(400, 'Informe login e senha');

  // 1) back só CONFIRMA as credenciais
  const res = await backendFetch('<endpoint de login>', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) return responder(res);
  const usuario = await res.json(); // { codigoUsuario, nome }

  // 2) BUSCAR unidades; a inicial é a primeira da lista
  const unidades = await buscarUnidades(usuario.codigoUsuario);
  if (!unidades) return erro(502, 'Não foi possível carregar as unidades');
  if (unidades.length === 0) return erro(403, 'Usuário sem unidades disponíveis');
  const unidadeSelecionada = unidades[0].codigo;

  // 3) BUSCAR permissões da unidade inicial
  const permissoes = await buscarPermissoes(usuario.codigoUsuario, unidadeSelecionada);
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  // 4) monta o token e grava o cookie httpOnly
  const resposta = NextResponse.json({ ok: true });
  await gravarSessao(resposta, { codigoUsuario: usuario.codigoUsuario, nome: usuario.nome, unidades, unidadeSelecionada, permissoes });
  return resposta;
}
```

**Logout** (público): `const r = NextResponse.json({ ok: true }); limparSessao(r); return r;`

**Sessão atual** (autenticado): o cookie é httpOnly, então o client pede ao BFF que o decodifique.

```ts
// app/api/session/route.ts
export async function GET() {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  return NextResponse.json(sessao, { headers: { 'Cache-Control': 'no-store' } });
}
```

**Trocar unidade** (autenticado): só aceita unidade que já está no token.

```ts
// app/api/session/unidade/route.ts
export async function POST(req: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');

  const body = await req.json().catch(() => null);
  const codigoUnidade = typeof body?.codigoUnidade === 'string' ? body.codigoUnidade : '';
  if (!sessao.unidades.some((u) => u.codigo === codigoUnidade)) {
    return erro(403, 'Unidade não disponível para este usuário');
  }

  const permissoes = await buscarPermissoes(sessao.codigoUsuario, codigoUnidade); // BUSCAR permissões da nova unidade
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  const nova = { ...sessao, unidadeSelecionada: codigoUnidade, permissoes };
  const resposta = NextResponse.json(nova, { headers: { 'Cache-Control': 'no-store' } });
  await gravarSessao(resposta, nova); // reemite o cookie
  return resposta;
}
```

**Renovar sessão** (autenticado): relê tudo no back e reemite o cookie com validade nova.

```ts
// app/api/session/refresh/route.ts
export async function POST() {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');

  const unidades = await buscarUnidades(sessao.codigoUsuario); // BUSCAR unidades atuais
  if (!unidades) return erro(502, 'Não foi possível carregar as unidades'); // back fora: mantém a sessão
  if (unidades.length === 0) {                                              // acesso revogado
    const revogada = erro(401, 'Acesso revogado');
    limparSessao(revogada);
    return revogada;
  }

  const unidadeSelecionada = unidades.some((u) => u.codigo === sessao.unidadeSelecionada)
    ? sessao.unidadeSelecionada
    : unidades[0].codigo;

  const permissoes = await buscarPermissoes(sessao.codigoUsuario, unidadeSelecionada); // BUSCAR permissões atuais
  if (!permissoes) return erro(502, 'Não foi possível carregar as permissões');

  const nova = { ...sessao, unidades, unidadeSelecionada, permissoes };
  const resposta = NextResponse.json(nova, { headers: { 'Cache-Control': 'no-store' } });
  await gravarSessao(resposta, nova);
  return resposta;
}
```

### Passo 9 — Endpoints de negócio (`app/api/<recurso>/route.ts`)
Todo handler protegido segue o mesmo molde: sessão → permissão → validação → back com a **unidade do token**.

```ts
export async function POST(req: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao) return erro(401, 'Sessão inválida ou expirada');
  const negado = negarSemPermissao(sessao, 'B');   // a mesma letra da policy
  if (negado) return negado;

  const { dados, erro: msg } = validar(await req.json().catch(() => null));
  if (!dados) return erro(400, msg ?? 'Dados inválidos');

  const res = await backendFetch('<endpoint do recurso>', {
    method: 'POST',
    headers: { 'x-unidade-selecionada': sessao.unidadeSelecionada }, // NUNCA a unidade vinda do client
    body: JSON.stringify(dados),
  });
  return responder(res);
}
```

### Passo 10 — Leitura em Server Components (`bff/ssr/bff-fetch.ts` + `page.tsx`)
A página chama os endpoints do próprio BFF repassando o cookie, então a leitura também passa pelo middleware e pela policy.

```ts
// bff/ssr/bff-fetch.ts
import 'server-only';
import { cookies } from 'next/headers';
import { getBffUrl } from '@/bff/config';

export async function bffFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cookie = (await cookies()).toString();
  return fetch(`${getBffUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...(init.headers as Record<string, string>), cookie },
  });
}
```

```tsx
// app/<area-logada>/page.tsx
export const dynamic = 'force-dynamic';

export default async function Pagina() {
  let initialData; let naoAutenticado = false;
  try {
    const res = await bffFetch('/api/<recurso>');
    naoAutenticado = res.status === 401;
    if (res.ok) initialData = await res.json();
  } catch { /* sem dados iniciais: o client busca */ }

  if (naoAutenticado) redirect('/login');
  return <Container initialData={initialData} />;
}
```

### Passo 11 — Camada client

**`HttpClient` + `bffHttp`**: base relativa; todo erro vira `ApiError`; 401 dispara o callback de sessão expirada.

```ts
// client/http/bff-http.ts
export const bffHttp = new HttpClient({
  baseURL: '/api', // sempre relativa: o browser só enxerga o próprio Next
  aoSessaoExpirada: () => {
    // na tela de login um 401 significa "credenciais inválidas": não redireciona
    if (window.location.pathname !== '/login') window.location.href = '/login';
  },
});
```

**`SessionProvider`**: sessão, `can()` (só UI) e a **renovação a cada 5 minutos**.

```tsx
// client/core/SessionProvider.tsx
const INTERVALO_RENOVACAO_MS = 5 * 60_000; // menor que o TTL do cookie (15 min), com folga

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const consulta = useQuery({ queryKey: chaves.sessao, queryFn: () => sessionApi.buscar(), staleTime: 5 * 60_000 });
  const session = consulta.data ?? null;

  const troca = useMutation<SessionClaims, Error, string>({
    mutationFn: (codigoUnidade) => sessionApi.trocarUnidade(codigoUnidade),
    onSuccess: (nova) => queryClient.setQueryData(chaves.sessao, nova),
  });

  // Renovação: o BFF relê unidades/permissões no back e reemite o cookie.
  // 401 (revogado) → bffHttp redireciona para /login. Erro de rede/502 → ignora; tenta no próximo ciclo.
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

  const can = useCallback((p: Permissao) => !!session?.permissoes.includes(p), [session]); // só UI; a segurança é do BFF
  // ... trocarUnidade, sair, Provider
}
```

**Chaves de cache**: a unidade faz parte da chave dos dados de negócio, então cada unidade tem o seu cache.

```ts
// client/core/query-keys.ts
export const chaves = {
  sessao: ['sessao'] as const,
  recurso: (unidade: string) => ['recurso', unidade] as const,
};
```

**Containers e filhos**: o container (pai) é o único que fala com a API via React Query; os filhos só recebem props.

### Passo 12 — Testes de arquitetura (`architecture/`)
Testes estáticos (leem os arquivos, não executam o código) que transformam as convenções em garantias. O build roda
`vitest` no `prebuild`, então quebrar uma regra quebra o build.

```ts
// arquitetura.test.ts (exemplo de duas regras)
it('todo endpoint de app/api está coberto por uma regra da policy (default-deny)', () => {
  const semRegra = handlers.filter((h) => !buscarAcesso(h.metodo, h.exemplo)).map(id);
  expect(semRegra).toEqual([]);
});

it('endpoints protegidos revalidam a sessão e a permissão exigida pela policy', () => {
  for (const h of handlers) {
    const acesso = buscarAcesso(h.metodo, h.exemplo);
    if (!acesso || acesso === 'publico') continue;
    expect(h.corpo).toMatch(/obterSessao\(/);
    if (acesso !== 'autenticado') {
      expect(h.corpo).toMatch(new RegExp(`negarSemPermissao\\(\\s*sessao\\s*,\\s*'${acesso}'\\s*\\)`));
    }
  }
});
```

Regras que valem cobrir:
- Só existem as pastas `shared`, `client`, `bff`, `app` e `middleware.ts`; direção das dependências entre zonas.
- `"use client"` só dentro de `client/`; client sem `process.env`, `document.cookie`, `localStorage` nem URL absoluta.
- Todo arquivo de `bff/` (fora de `edge/`) importa `server-only`; `bff/edge` não (roda no edge).
- Só login e logout são públicos; handlers protegidos não leem a unidade do client e enviam a do token ao back.
- O middleware usa `lerSessao()` e cobre todas as páginas no `matcher`.

---

## 5. Fluxos resumidos

**Login**
```
Browser → BFF: usuário/senha
BFF → Back: confirmar credenciais
BFF → Back: buscar unidades
BFF → Back: buscar permissões da unidade inicial
BFF → Browser: cookie httpOnly com JWT
```

**Requisição protegida**
```
Browser → Middleware: valida cookie + policy (401/403 aqui, antes do handler)
         → Handler: obterSessao() + negarSemPermissao()
         → Back: chamada com a unidade DO TOKEN
```

**Troca de unidade**
```
Browser → BFF: nova unidade
BFF: confere que está nas unidades do token
BFF → Back: buscar permissões da nova unidade
BFF → Browser: cookie reemitido
```

**Renovação (a cada 5 min)**
```
SessionProvider → BFF: renovar
BFF → Back: buscar unidades e permissões atuais
   ok → cookie reemitido (validade nova)
   revogado → cookie apagado + 401 → /login
   back fora do ar → mantém sessão, tenta de novo no próximo ciclo
```

---

## 6. O que adaptar em cada projeto

| Item | Onde |
|---|---|
| Corpo do token (quais claims) | `shared/types/session.ts` |
| Conjunto de permissões e o que cada uma significa | `shared/types/session.ts` + `bff/edge/policy.ts` |
| Como o back confirma credenciais, lista unidades e permissões | `bff/backend/backend-client.ts` |
| Rotas e permissão exigida | `bff/edge/policy.ts` e `app/api/**` |
| Páginas protegidas | `matcher` do `middleware.ts` |
| Tempo de vida da sessão e intervalo de renovação | `session-config.ts` (TTL) e `SessionProvider.tsx` (intervalo). Mantenha o TTL maior que o intervalo, com folga (ex.: 15 min vs 5 min). |
| Se o projeto não tem o conceito de "unidade" | Remover `unidades`/`unidadeSelecionada` e a rota de troca; as permissões passam a ser globais do usuário. |

---

## 7. Checklist de segurança antes de ir para produção

- [ ] `SESSION_SECRET` aleatório, ≥ 32 caracteres, fora do repositório, e **não** é o valor de exemplo.
- [ ] Back-end **não acessível pela internet**: só o BFF o alcança (rede privada ou segredo/mTLS entre BFF e back). Ele não tem autenticação própria.
- [ ] Console de banco (ex.: H2) desligado.
- [ ] Cookie `httpOnly`, `sameSite`, `secure` em produção; considerar o prefixo `__Host-`.
- [ ] Next.js em versão sem a falha de bypass de middleware (CVE-2025-29927: usar ≥ 15.2.3 ou superior). Os handlers revalidam, o que limita o impacto.
- [ ] Rate limit no login (BFF e back) e resposta com tempo parecido para usuário inexistente e senha errada.
- [ ] Checagem de `Origin` nos métodos que alteram dados, além do `sameSite`.
- [ ] Teto absoluto de sessão (ex.: 8 h desde o login, guardado como claim): sem ele, um cookie roubado pode ser renovado enquanto o usuário existir.
- [ ] Validar `iss` e `aud` no token e cada item dos claims (não só o tipo do primeiro nível).

---

## 8. Limitações conhecidas

- **Revogação não é imediata**: uma permissão retirada vale por até 5 min (intervalo de renovação). Para revogação
  instantânea é preciso sessão com store (ex.: Redis) ou lista de sessões revogadas.
- **Logout stateless**: apaga o cookie no browser, mas não invalida o token já emitido.
- Os testes de arquitetura são análise estática (imports, diretivas e padrões de texto); não executam o código.
- Navegadores reduzem a frequência de timers em abas ocultas. Se a aba ficar oculta por mais que o TTL, o cookie expira e o próximo request leva ao `/login`.
