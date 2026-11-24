import 'server-only';
import type { SolicitacaoInput, StatusSolicitacao } from '@/shared/types/solicitacao';

const STATUS_VALIDOS: StatusSolicitacao[] = ['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA'];

/** Valida o corpo do client e devolve só os campos permitidos (ignora qualquer unidade enviada). */
export function validarSolicitacao(body: unknown): { dados?: SolicitacaoInput; erro?: string } {
  if (typeof body !== 'object' || body === null) return { erro: 'Corpo da requisição inválido' };
  const b = body as Record<string, unknown>;

  const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  const status = b.status as StatusSolicitacao;

  if (!titulo) return { erro: 'Informe o título' };
  if (titulo.length > 255) return { erro: 'Título deve ter no máximo 255 caracteres' };
  if (descricao.length > 1000) return { erro: 'Descrição deve ter no máximo 1000 caracteres' };
  if (!STATUS_VALIDOS.includes(status)) return { erro: 'Status inválido' };

  return { dados: { titulo, descricao, status } };
}
