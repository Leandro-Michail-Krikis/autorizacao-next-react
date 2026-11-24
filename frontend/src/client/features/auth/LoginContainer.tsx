'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/client/api/auth.api';
import LoginForm from './components/LoginForm';

/** Pai da tela de login: controla a requisição; o formulário só recebe props. */
export default function LoginContainer() {
  const router = useRouter();

  const entrar = useMutation<void, Error, { login: string; senha: string }>({
    mutationFn: ({ login, senha }) => authApi.login(login, senha),
    onSuccess: () => {
      router.replace('/solicitacoes');
      router.refresh();
    },
  });

  return (
    <LoginForm
      carregando={entrar.isPending}
      erro={entrar.error?.message ?? null}
      onEntrar={(login, senha) => entrar.mutate({ login, senha })}
    />
  );
}
