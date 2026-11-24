# POC Solicitações — Spring Boot (back) + Next.js (BFF + front)

    Browser ──> Next.js (middleware + route handlers = BFF) ──> Spring Boot (H2)
                  cookie httpOnly com JWT                        sem autorização

## Subir
1. Back:   cd backend && mvn spring-boot:run          (porta 8080)
2. Front:  cd frontend && npm install && npm run dev   (porta 3000)
   Variáveis em frontend/.env.local (BACKEND_URL, BFF_INTERNAL_URL, SESSION_SECRET).
   Se rodar o Next em outra porta, ajuste BFF_INTERNAL_URL.
3. Testes de arquitetura: cd frontend && npm test   (roda também antes de `npm run build`)

## Estrutura do front: pastas por ONDE o código executa

    src/
      shared/            roda nos dois lados. Puro: tipos e constantes. Sem env, sem I/O, sem imports externos.
        types/
      client/            SÓ browser (e SSR dos client components). Nunca importa bff/.
        http/            HttpClient (classe utilitária sobre axios), ApiError, instância bffHttp (baseURL '/api')
        api/             uma classe por recurso: SolicitacaoApi, SessionApi, AuthApi (usam o HttpClient)
        core/            infraestrutura transversal: QueryProvider, SessionProvider (session manager), AppShell
        ui/              componentes apresentacionais genéricos (Header, UnidadeSwitcher): só props
        features/
          solicitacoes/  SolicitacoesContainer (PAI), solicitacao.queries.ts (React Query), components/ (filhos: só props)
          auth/          LoginContainer (PAI), components/LoginForm
      bff/               SÓ servidor. Nunca importa client/.
        edge/            módulos que o middleware (runtime edge) também usa: policy, token (JWT), session-config
        (demais)         `import 'server-only'` na 1ª linha: session, config, backend/, http/, validation/, ssr/
      app/               só roteamento e composição
        api/**/route.ts  endpoints do BFF (finos: sessão + permissão + chamada ao back)
        **/page.tsx      server components (SSR): buscam a 1ª carga via bff/ssr/bff-fetch
      middleware.ts      porteiro do BFF (exigido pelo Next nesta posição)

Dependências permitidas (as setas só apontam para a direita; os testes de arquitetura garantem):

    shared  <-  client            shared  <-  bff-edge  <-  bff  <-  app/api
    shared  <-  app/pages (-> client com "use client", -> bff/ssr)         middleware -> bff-edge, shared

## Camadas do front
- Client: `SolicitacoesContainer` é o PAI da tela. Só ele fala com a API (via React Query). Os filhos
  (`SolicitacaoToolbar`, `SolicitacaoTable`, `SolicitacaoModal`, `Header`, `UnidadeSwitcher`, `LoginForm`)
  recebem dados e callbacks por props e não fazem requisição.
  Toda chamada HTTP passa pelo `HttpClient` (axios). O client só enxerga /api/* do próprio Next.
- Server components: `app/solicitacoes/page.tsx` busca a primeira carga via fetch no BFF (passando pelo middleware)
  e a entrega ao container como `initialData`. Depois o React Query assume.
- BFF: middleware + route handlers + bff/*. Única camada que conhece o back e que autoriza.

## Corpo do token (JWT HS256, cookie "session", httpOnly)
{ codigoUsuario, nome, unidades[], unidadeSelecionada, permissoes[] }

## Renovação da sessão
Cookie com validade de 15 min (SESSION_MAX_AGE). O SessionProvider chama POST /api/session/refresh a cada 5 min;
o BFF relê unidades e permissões no back e reemite o cookie. Mudou permissão no back -> reflete em até 5 min.
Usuário sem unidades (revogado) -> 401 + cookie apagado -> client vai para /login. Aba fechada -> sessão expira em 15 min.

## Permissão por rota (bff/edge/policy.ts, default-deny)
GET /api/solicitacoes -> A | POST -> B | PUT /api/solicitacoes/:id -> C | DELETE /api/solicitacoes/:id -> D
GET /api/session, POST /api/session/unidade e POST /api/session/refresh -> apenas sessão válida
Públicos: POST /api/auth/login e POST /api/auth/logout

## Testes de arquitetura (frontend/architecture)
Estrutura e direção das dependências
- Só existem as pastas shared, client, bff, app e middleware.ts (nada de `lib/` genérica).
- Direção das dependências entre zonas (matriz acima) e imports externos proibidos por zona
  (ex.: client sem jose/server-only/next/headers; bff e shared sem react/axios; shared sem nenhum import externo).
- Páginas/layouts só importam client components com "use client" e `bff/ssr`.
- "use client" só aparece dentro de src/client.

Client
- Sem process.env, document.cookie, localStorage/sessionStorage nem URL absoluta.
- axios só dentro de client/http; sem `fetch` direto; baseURL sempre relativa a /api.
- Só containers, *.queries.ts e core importam as classes de API.
- Componentes filhos (components/ e ui/) não importam API, HTTP, React Query, next/navigation nem useSession.

BFF
- Todo arquivo de bff/ (fora de bff/edge) importa `server-only`; bff/edge não (roda no edge).
- Cookie httpOnly + sameSite + secure; nenhuma NEXT_PUBLIC_* expõe segredo/URL do back.
- Todo handler de app/api está coberto pela policy e toda regra tem handler; só login/logout são públicos.
- Handlers protegidos chamam obterSessao() e negarSemPermissao(sessao, '<letra da policy>'), nunca leem a unidade
  do client e enviam ao back sessao.unidadeSelecionada.
- Middleware usa lerSessao() e toda página nova precisa estar no matcher.

Limitações: análise estática (imports, diretivas e padrões de texto); não executa o código.
