import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Raiz do front. Pode ser sobrescrita por ARQUITETURA_RAIZ (útil para testar os próprios testes). */
export const RAIZ = process.env.ARQUITETURA_RAIZ ?? path.resolve(__dirname, '..');
export const SRC = path.join(RAIZ, 'src');

export function listarArquivos(dir: string = SRC): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) return listarArquivos(completo);
    return /\.(ts|tsx)$/.test(e.name) ? [completo] : [];
  });
}

export const ler = (arquivo: string): string => fs.readFileSync(arquivo, 'utf8');

/** Caminho relativo a src/, com barras normais. */
export const rel = (arquivo: string): string => path.relative(SRC, arquivo).split(path.sep).join('/');

/** True se a diretiva "use client" é a primeira instrução do arquivo (comentários antes são ignorados). */
export function ehClientComponent(arquivo: string): boolean {
  const sf = ts.createSourceFile(arquivo, ler(arquivo), ts.ScriptTarget.Latest, true);
  const primeira = sf.statements[0];
  return (
    !!primeira &&
    ts.isExpressionStatement(primeira) &&
    ts.isStringLiteral(primeira.expression) &&
    primeira.expression.text === 'use client'
  );
}

/** Todos os módulos importados pelo arquivo (inclui `import type`, `export from` e import()). */
export function importsDe(arquivo: string): string[] {
  return ts.preProcessFile(ler(arquivo), true, true).importedFiles.map((i) => i.fileName);
}

export const ehLocal = (spec: string): boolean => spec.startsWith('@/') || spec.startsWith('.');

/** Resolve import local (alias @/ ou relativo) para o arquivo real; null se não achar. */
export function resolver(origem: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(origem), spec);
  else return null;

  const candidatos = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  return candidatos.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

/**
 * Zonas de execução. Cada pasta de primeiro nível de src/ pertence a exatamente uma.
 *  shared    : roda nos dois lados (puro, sem env, sem I/O)
 *  client    : só browser (e SSR dos client components)
 *  bff-edge  : BFF que o middleware também usa (runtime edge)
 *  bff       : BFF somente servidor (server-only)
 *  app-api   : route handlers (endpoints do BFF)
 *  app-pages : páginas e layouts (server components): só composição
 */
export type Zona = 'shared' | 'client' | 'bff-edge' | 'bff' | 'app-api' | 'app-pages' | 'middleware' | 'desconhecida';

export function zonaDe(arquivo: string): Zona {
  const r = rel(arquivo);
  if (r === 'middleware.ts') return 'middleware';
  if (r.startsWith('shared/')) return 'shared';
  if (r.startsWith('client/')) return 'client';
  if (r.startsWith('bff/edge/')) return 'bff-edge';
  if (r.startsWith('bff/')) return 'bff';
  if (r.startsWith('app/api/')) return 'app-api';
  if (r.startsWith('app/')) return 'app-pages';
  return 'desconhecida';
}

export const arquivosDaZona = (...zonas: Zona[]): string[] => listarArquivos().filter((f) => zonas.includes(zonaDe(f)));
