'use client';

import { useState, type FormEvent } from 'react';

interface LoginFormProps {
  carregando: boolean;
  erro: string | null;
  onEntrar: (login: string, senha: string) => void;
}

export default function LoginForm({ carregando, erro, onEntrar }: LoginFormProps) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');

  function enviar(e: FormEvent) {
    e.preventDefault();
    onEntrar(login, senha);
  }

  return (
    <form onSubmit={enviar}>
      {erro && <div className="alert alert-danger py-2">{erro}</div>}
      <div className="mb-3">
        <label className="form-label" htmlFor="login">Login</label>
        <input id="login" className="form-control" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus required />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="senha">Senha</label>
        <input id="senha" type="password" className="form-control" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      </div>
      <button className="btn btn-primary w-100" disabled={carregando}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
