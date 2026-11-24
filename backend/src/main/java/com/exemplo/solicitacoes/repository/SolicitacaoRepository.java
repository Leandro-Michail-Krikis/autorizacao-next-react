package com.exemplo.solicitacoes.repository;

import com.exemplo.solicitacoes.entity.Solicitacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {

    List<Solicitacao> findByUnidadeCodigoOrderByDataCriacaoDesc(String codigoUnidade);

    Optional<Solicitacao> findByIdAndUnidadeCodigo(Long id, String codigoUnidade);
}
