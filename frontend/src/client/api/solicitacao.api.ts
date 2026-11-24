import { bffHttp } from '@/client/http/bff-http';
import type { HttpClient } from '@/client/http/http-client';
import type { Solicitacao, SolicitacaoInput } from '@/shared/types/solicitacao';

/** A unidade NÃO é enviada: o BFF a extrai do token. */
export class SolicitacaoApi {
  constructor(private readonly http: HttpClient) {}

  listar(): Promise<Solicitacao[]> {
    return this.http.get<Solicitacao[]>('/solicitacoes');
  }

  criar(dados: SolicitacaoInput): Promise<void> {
    return this.http.post('/solicitacoes', dados);
  }

  editar(id: number, dados: SolicitacaoInput): Promise<void> {
    return this.http.put(`/solicitacoes/${id}`, dados);
  }

  excluir(id: number): Promise<void> {
    return this.http.delete(`/solicitacoes/${id}`);
  }
}

export const solicitacaoApi = new SolicitacaoApi(bffHttp);
