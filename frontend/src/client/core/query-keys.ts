export const chaves = {
  sessao: ['sessao'] as const,
  /** A unidade faz parte da chave: cada unidade tem o seu cache. */
  solicitacoes: (unidade: string) => ['solicitacoes', unidade] as const,
};
