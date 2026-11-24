/** Erro padronizado para qualquer falha de chamada ao BFF. status 0 = sem resposta (rede). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
