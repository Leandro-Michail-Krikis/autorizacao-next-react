'use client';

import type { UnidadeInfo } from '@/shared/types/session';
import UnidadeSwitcher from './UnidadeSwitcher';

interface HeaderProps {
  nome: string | null;
  unidades: UnidadeInfo[];
  unidadeAtual: UnidadeInfo | null;
  trocandoUnidade: boolean;
  erroTrocaUnidade: string | null;
  onTrocarUnidade: (codigoUnidade: string) => void;
  onSair: () => void;
}

export default function Header({
  nome,
  unidades,
  unidadeAtual,
  trocandoUnidade,
  erroTrocaUnidade,
  onTrocarUnidade,
  onSair,
}: HeaderProps) {
  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <span className="navbar-brand mb-0 h1">Solicitações</span>
        <div className="d-flex align-items-center gap-3">
          {nome && <span className="text-light small">{nome}</span>}
          {unidadeAtual && (
            <UnidadeSwitcher
              unidades={unidades}
              unidadeAtual={unidadeAtual}
              trocando={trocandoUnidade}
              erro={erroTrocaUnidade}
              onTrocar={onTrocarUnidade}
            />
          )}
          <button className="btn btn-outline-light btn-sm" onClick={onSair}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
