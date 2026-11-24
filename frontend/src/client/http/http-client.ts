import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';

export interface HttpClientOptions {
  /** Sempre relativo ao próprio Next (ex.: '/api'). O browser nunca fala direto com o back. */
  baseURL: string;
  /** Chamado quando o BFF responde 401 (sessão inválida ou expirada). */
  aoSessaoExpirada?: () => void;
}

/**
 * Classe utilitária de HTTP do client. Encapsula o axios:
 *  - JSON por padrão
 *  - todo erro vira ApiError com a mensagem devolvida pelo BFF
 *  - 401 dispara o callback de sessão expirada
 */
export class HttpClient {
  private readonly instance: AxiosInstance;

  constructor({ baseURL, aoSessaoExpirada }: HttpClientOptions) {
    this.instance = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.instance.interceptors.response.use(
      (resposta) => resposta,
      (erro: unknown) => Promise.reject(this.traduzir(erro, aoSessaoExpirada)),
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T>(url, config).then((r) => r.data);
  }

  post<T = void>(url: string, corpo?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post<T>(url, corpo, config).then((r) => r.data);
  }

  put<T = void>(url: string, corpo?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put<T>(url, corpo, config).then((r) => r.data);
  }

  delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T>(url, config).then((r) => r.data);
  }

  private traduzir(erro: unknown, aoSessaoExpirada?: () => void): ApiError {
    if (axios.isAxiosError(erro)) {
      const resposta = erro.response;
      if (!resposta) return new ApiError(0, 'Falha de comunicação com o servidor');
      if (resposta.status === 401) aoSessaoExpirada?.();
      const mensagem = (resposta.data as { message?: string } | undefined)?.message;
      return new ApiError(resposta.status, mensagem ?? 'Erro ao processar a requisição');
    }
    return new ApiError(0, erro instanceof Error ? erro.message : 'Erro inesperado');
  }
}
