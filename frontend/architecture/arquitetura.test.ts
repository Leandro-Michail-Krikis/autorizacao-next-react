/**
 * Testes de arquitetura do front.
 * A estrutura de src/ é dividida por ONDE o código executa (shared, client, bff) e
 * estes testes garantem as fronteiras entre as zonas. Rodam em `npm test` e antes de `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGRAS, buscarAcesso } from '../src/bff/edge/policy';
import {
  RAIZ,
  SRC,
  arquivosDaZona,
  ehClientComponent,
  ehLocal,
  importsDe,
  ler,
  listarArquivos,
  rel,
  resolver,
  zonaDe,
  type Zona,
} from './helpers';

const casa = (spec: string, padrao: string) => padrao === '*' || spec === padrao || spec.startsWith(`${padrao}/`);
const REACT_E_CLIENT_LIBS = ['react', 'react-dom', 'axios', '@tanstack/react-query'];

// ─────────────────────────── Estrutura e direção das dependências ───────────────────────────

/** Para quais zonas cada zona pode importar. */
const PERMITIDO: Record<Zona, Zona[]> = {
  shared: ['shared'],
  client: ['client', 'shared'],
  'bff-edge': ['bff-edge', 'shared'],
  bff: ['bff', 'bff-edge', 'shared'],
  'app-api': ['bff', 'bff-edge', 'shared'],
  'app-pages': ['app-pages', 'client', 'bff', 'shared'], // client/bff com restrições no teste abaixo
  middleware: ['bff-edge', 'shared'],
  desconhecida: [],
};

/** Imports externos proibidos por zona ('*' = nenhum import externo permitido). */
const EXTERNOS_PROIBIDOS: Partial<Record<Zona, string[]>> = {
  shared: ['*'],
  client: ['server-only', 'jose', 'next/headers', 'next/server'],
  'bff-edge': ['server-only', 'next/headers', ...REACT_E_CLIENT_LIBS],
  bff: REACT_E_CLIENT_LIBS,
  'app-api': REACT_E_CLIENT_LIBS,
  'app-pages': ['axios', '@tanstack/react-query', 'jose', 'next/headers'],
  middleware: ['server-only', 'next/headers', ...REACT_E_CLIENT_LIBS],
};

describe('Estrutura de src/', () => {
  it('só existem as pastas de primeiro nível conhecidas (nada de "lib/" genérica)', () => {
    const permitidos = ['app', 'bff', 'client', 'shared', 'middleware.ts'];
    const extras = fs.readdirSync(SRC).filter((n) => !permitidos.includes(n));
    expect(extras).toEqual([]);
  });

  it('o scanner enxerga todas as zonas (evita teste vazio)', () => {
    for (const zona of ['shared', 'client', 'bff-edge', 'bff', 'app-api', 'app-pages', 'middleware'] as Zona[]) {
      expect(arquivosDaZona(zona).length).toBeGreaterThan(0);
    }
  });

  it('todos os imports locais são resolvidos (nada escapa da análise)', () => {
    const naoResolvidos = listarArquivos().flatMap((f) =>
      importsDe(f)
        .filter((spec) => ehLocal(spec) && !resolver(f, spec))
        .map((spec) => `${rel(f)} importa ${spec}`),
    );
    expect(naoResolvidos).toEqual([]);
  });

  it('direção das dependências entre zonas é respeitada', () => {
    const violacoes = listarArquivos().flatMap((f) => {
      const origem = zonaDe(f);
      return importsDe(f)
        .filter(ehLocal)
        .map((spec) => resolver(f, spec))
        .filter((d): d is string => !!d)
        .filter((d) => !PERMITIDO[origem].includes(zonaDe(d)))
        .map((d) => `${rel(f)} (${origem}) -> ${rel(d)} (${zonaDe(d)})`);
    });
    expect(violacoes).toEqual([]);
  });

  it('imports externos respeitam a zona (ex.: client sem jose/server-only; bff sem react/axios)', () => {
    const violacoes = listarArquivos().flatMap((f) => {
      const proibidos = EXTERNOS_PROIBIDOS[zonaDe(f)] ?? [];
      return importsDe(f)
        .filter((spec) => !ehLocal(spec))
        .filter((spec) => proibidos.some((p) => casa(spec, p)))
        .map((spec) => `${rel(f)} (${zonaDe(f)}) importa "${spec}"`);
    });
    expect(violacoes).toEqual([]);
  });

  it('páginas e layouts só usam client components (com "use client") e bff/ssr', () => {
    const violacoes = arquivosDaZona('app-pages').flatMap((f) =>
      importsDe(f)
        .filter(ehLocal)
        .map((spec) => ({ spec, destino: resolver(f, spec) }))
        .filter(({ destino }) => !!destino)
        .filter(({ destino }) => {
          const zona = zonaDe(destino!);
          if (zona === 'client') return !ehClientComponent(destino!);
          if (zona === 'bff') return !rel(destino!).startsWith('bff/ssr/');
          return false;
        })
        .map(({ spec }) => `${rel(f)} importa ${spec}`),
    );
    expect(violacoes).toEqual([]);
  });

  it('"use client" só aparece dentro de src/client (exceto error/global-error do Next)', () => {
    const fora = listarArquivos()
      .filter(ehClientComponent)
      .filter((f) => zonaDe(f) !== 'client')
      .filter((f) => !/(^|\/)(error|global-error)\.tsx$/.test(rel(f)))
      .map(rel);
    expect(fora).toEqual([]);
  });
});

// ─────────────────────────── Client: o que é permitido no browser ───────────────────────────

const PADROES_PROIBIDOS_NO_BROWSER: [RegExp, string][] = [
  [/process\.env/, 'process.env'],
  [/document\.cookie/, 'document.cookie'],
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
  [/https?:\/\//, 'URL absoluta (o client só chama o próprio Next, via /api)'],
];

describe('Client — o que vai para o browser', () => {
  const noBrowser = arquivosDaZona('client', 'shared');

  it('não usa segredos, cookie do browser, storage nem URL absoluta', () => {
    const violacoes = noBrowser.flatMap((f) => {
      const texto = ler(f);
      return PADROES_PROIBIDOS_NO_BROWSER.filter(([regex]) => regex.test(texto)).map(([, nome]) => `${rel(f)}: ${nome}`);
    });
    expect(violacoes).toEqual([]);
  });

  it('axios só é importado dentro de client/http (o resto usa HttpClient)', () => {
    const violacoes = listarArquivos()
      .filter((f) => !rel(f).startsWith('client/http/'))
      .filter((f) => importsDe(f).includes('axios'))
      .map(rel);
    expect(violacoes).toEqual([]);
  });

  it('o client não chama fetch direto: toda requisição passa pelo HttpClient', () => {
    const violacoes = arquivosDaZona('client')
      .filter((f) => /\bfetch\(/.test(ler(f)))
      .map(rel);
    expect(violacoes).toEqual([]);
  });

  it('todo HttpClient do client tem baseURL relativa a /api', () => {
    const violacoes = arquivosDaZona('client').flatMap((f) =>
      [...ler(f).matchAll(/baseURL:\s*(['"`])([^'"`]*)/g)]
        .filter((m) => !m[2].startsWith('/api'))
        .map((m) => `${rel(f)}: baseURL "${m[2]}"`),
    );
    expect(violacoes).toEqual([]);
  });

  it('só containers, hooks de query e o core importam as classes de API', () => {
    const podeUsarApi = (r: string) =>
      r.startsWith('client/api/') ||
      r.startsWith('client/http/') ||
      r.startsWith('client/core/') ||
      /Container\.tsx$/.test(r) ||
      /\.queries\.ts$/.test(r);

    const violacoes = arquivosDaZona('client')
      .filter((f) => !podeUsarApi(rel(f)))
      .flatMap((f) =>
        importsDe(f)
          .filter(ehLocal)
          .map((spec) => resolver(f, spec))
          .filter((d): d is string => !!d)
          .filter((d) => rel(d).startsWith('client/api/') || rel(d).startsWith('client/http/'))
          .map((d) => `${rel(f)} importa ${rel(d)}`),
    );
    expect(violacoes).toEqual([]);
  });

  it('componentes filhos (components/ e ui/) são apresentacionais: sem requisição, sem react-query, sem sessão', () => {
    const filhos = arquivosDaZona('client').filter((f) => /^client\/(ui\/|features\/[^/]+\/components\/)/.test(rel(f)));
    expect(filhos.length).toBeGreaterThan(0);

    const violacoes = filhos.flatMap((f) =>
      importsDe(f)
        .filter((spec) => {
          if (!ehLocal(spec)) return spec === 'axios' || spec.startsWith('@tanstack/') || spec === 'next/navigation';
          const destino = resolver(f, spec);
          if (!destino) return false;
          const r = rel(destino);
          return (
            r.startsWith('client/api/') ||
            r.startsWith('client/http/') ||
            r.startsWith('client/core/') ||
            /\.queries\.ts$/.test(r)
          );
        })
        .map((spec) => `${rel(f)} importa ${spec}`),
    );
    expect(violacoes).toEqual([]);
  });
});

// ─────────────────────────── BFF ───────────────────────────

describe('BFF — módulos de servidor', () => {
  it('todo arquivo de bff/ (fora de bff/edge) importa "server-only"', () => {
    const faltando = arquivosDaZona('bff')
      .filter((f) => !importsDe(f).includes('server-only'))
      .map(rel);
    expect(faltando).toEqual([]);
  });

  it('cookie de sessão é httpOnly, sameSite e secure', () => {
    const sessao = ler(path.join(SRC, 'bff/session.ts'));
    expect(sessao).toMatch(/httpOnly:\s*true/);
    expect(sessao).toMatch(/sameSite:\s*'(lax|strict)'/);
    expect(sessao).toMatch(/secure:/);
  });

  it('nenhuma variável NEXT_PUBLIC_ expõe segredo, token ou URL do back', () => {
    const arquivos = [
      ...listarArquivos().map((f) => ({ nome: rel(f), texto: ler(f) })),
      ...fs
        .readdirSync(RAIZ)
        .filter((n) => n.startsWith('.env'))
        .map((n) => ({ nome: n, texto: ler(path.join(RAIZ, n)) })),
    ];
    const violacoes = arquivos
      .filter((a) => /NEXT_PUBLIC_\w*(SECRET|TOKEN|KEY|PASSWORD|BACKEND)/i.test(a.texto))
      .map((a) => a.nome);
    expect(violacoes).toEqual([]);
  });
});

// ─────────────────────────── BFF: endpoints (app/api) ───────────────────────────

interface Handler {
  metodo: string;
  caminho: string; // ex.: /api/solicitacoes/:id
  exemplo: string; // ex.: /api/solicitacoes/1 (para casar com a policy)
  corpo: string; // código do handler
}

const REGEX_HANDLER =
  /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;

function coletarHandlers(): Handler[] {
  return listarArquivos()
    .filter((f) => /^app\/api\/(.*\/)?route\.ts$/.test(rel(f)))
    .flatMap((arquivo) => {
      const segmentos = rel(arquivo).replace(/^app\//, '').replace(/\/?route\.ts$/, '');
      const caminho = '/' + segmentos.replace(/\[(\w+)\]/g, ':$1');
      const exemplo = '/' + segmentos.replace(/\[(\w+)\]/g, '1');
      const texto = ler(arquivo);

      return [...texto.matchAll(REGEX_HANDLER)].map((m) => {
        const proximo = texto.indexOf('\nexport ', (m.index ?? 0) + 1);
        return {
          metodo: (m[1] ?? m[2]) as string,
          caminho,
          exemplo,
          corpo: texto.slice(m.index, proximo === -1 ? undefined : proximo),
        };
      });
    });
}

const PUBLICOS_PERMITIDOS = ['POST /api/auth/login', 'POST /api/auth/logout'];

describe('BFF — endpoints (app/api) x política de acesso', () => {
  const handlers = coletarHandlers();
  const id = (h: Handler) => `${h.metodo} ${h.caminho}`;

  it('o scanner encontrou endpoints', () => {
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('todo endpoint está coberto por uma regra em policy.ts (default-deny)', () => {
    const semRegra = handlers.filter((h) => !buscarAcesso(h.metodo, h.exemplo)).map(id);
    expect(semRegra).toEqual([]);
  });

  it('toda regra de policy.ts tem um endpoint correspondente (sem regras órfãs)', () => {
    const orfas = REGRAS.filter((r) => !handlers.some((h) => h.metodo === r.metodo && r.caminho.test(h.exemplo))).map(
      (r) => `${r.metodo} ${r.caminho.source}`,
    );
    expect(orfas).toEqual([]);
  });

  it('somente login e logout são públicos', () => {
    const publicos = handlers.filter((h) => buscarAcesso(h.metodo, h.exemplo) === 'publico').map(id);
    expect(publicos.sort()).toEqual([...PUBLICOS_PERMITIDOS].sort());
  });

  it('endpoints protegidos revalidam a sessão e a permissão exigida pela policy', () => {
    const violacoes: string[] = [];
    for (const h of handlers) {
      const acesso = buscarAcesso(h.metodo, h.exemplo);
      if (!acesso || acesso === 'publico') continue;

      if (!/obterSessao\(/.test(h.corpo)) violacoes.push(`${id(h)}: não chama obterSessao()`);

      if (acesso !== 'autenticado') {
        const regex = new RegExp(`negarSemPermissao\\(\\s*sessao\\s*,\\s*'${acesso}'\\s*\\)`);
        if (!regex.test(h.corpo)) violacoes.push(`${id(h)}: não chama negarSemPermissao(sessao, '${acesso}')`);
      }
    }
    expect(violacoes).toEqual([]);
  });

  it('endpoints protegidos nunca leem a unidade do client (query, header ou cookie à parte)', () => {
    const proibidos = /searchParams|req\.headers|request\.headers|\bheaders\(\)/;
    const violacoes = handlers
      .filter((h) => buscarAcesso(h.metodo, h.exemplo) !== 'publico')
      .filter((h) => proibidos.test(h.corpo))
      .map((h) => `${id(h)}: lê dados de contexto vindos do client`);
    expect(violacoes).toEqual([]);
  });

  it('endpoints protegidos que chamam o back enviam a unidade do token', () => {
    const violacoes = handlers
      .filter((h) => buscarAcesso(h.metodo, h.exemplo) !== 'publico')
      .filter((h) => /backendFetch\(/.test(h.corpo) && !/sessao\.unidadeSelecionada/.test(h.corpo))
      .map((h) => `${id(h)}: chama o back sem sessao.unidadeSelecionada`);
    expect(violacoes).toEqual([]);
  });
});

// ─────────────────────────── Middleware ───────────────────────────

describe('Middleware — cobertura de rotas', () => {
  const middleware = ler(path.join(SRC, 'middleware.ts'));
  const bloco = middleware.match(/matcher:\s*\[([^\]]*)\]/);
  const padroes = bloco ? [...bloco[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]) : [];
  const cobre = (rota: string) =>
    padroes.some((p) => new RegExp('^' + p.replace('/:path*', '(?:/.*)?') + '$').test(rota));

  it('valida o cookie com lerSessao()', () => {
    expect(middleware).toMatch(/lerSessao\(/);
  });

  it('o matcher cobre todos os endpoints /api/*', () => {
    expect(cobre('/api/qualquer/coisa')).toBe(true);
  });

  it('todas as páginas (exceto "/") passam pelo middleware', () => {
    const paginas = listarArquivos()
      .map(rel)
      .filter((r) => /^app\/(.*\/)?page\.tsx$/.test(r))
      .map((r) => '/' + r.replace(/^app\/?/, '').replace(/\/?page\.tsx$/, '').replace(/\([^)]*\)\//g, ''))
      .map((r) => (r === '/' ? r : r.replace(/\/$/, '')))
      .filter((r) => r !== '/');

    const descobertas = paginas.filter((p) => !cobre(p));
    expect(descobertas).toEqual([]);
  });
});
