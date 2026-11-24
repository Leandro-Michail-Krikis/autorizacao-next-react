'use client';

import { useState } from 'react';
import type { UnidadeInfo } from '@/shared/types/session';

interface UnidadeSwitcherProps {
  unidades: UnidadeInfo[];
  unidadeAtual: UnidadeInfo;
  trocando: boolean;
  erro: string | null;
  onTrocar: (codigoUnidade: string) => void;
}

export default function UnidadeSwitcher({ unidades, unidadeAtual, trocando, erro, onTrocar }: UnidadeSwitcherProps) {
  const [aberto, setAberto] = useState(false); // estado apenas visual

  function escolher(codigo: string) {
    setAberto(false);
    if (codigo !== unidadeAtual.codigo) onTrocar(codigo);
  }

  return (
    <div className="dropdown position-relative">
      <button
        type="button"
        className="btn btn-outline-info btn-sm dropdown-toggle"
        onClick={() => setAberto((v) => !v)}
        disabled={trocando}
      >
        {trocando ? 'Trocando...' : `Unidade: ${unidadeAtual.codigo}`}
      </button>
      <ul className={`dropdown-menu${aberto ? ' show' : ''}`} style={{ right: 0, left: 'auto' }}>
        {unidades.map((u) => (
          <li key={u.codigo}>
            <button
              type="button"
              className={`dropdown-item${u.codigo === unidadeAtual.codigo ? ' active' : ''}`}
              onClick={() => escolher(u.codigo)}
            >
              {u.codigo} — {u.nome}
            </button>
          </li>
        ))}
      </ul>
      {erro && <div className="text-danger small position-absolute end-0">{erro}</div>}
    </div>
  );
}
