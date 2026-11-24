package com.exemplo.solicitacoes.repository;

import com.exemplo.solicitacoes.entity.Unidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UnidadeRepository extends JpaRepository<Unidade, Long> {
    Optional<Unidade> findByCodigo(String codigo);
}
