package com.exemplo.solicitacoes.repository;

import com.exemplo.solicitacoes.entity.UsuarioUnidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioUnidadeRepository extends JpaRepository<UsuarioUnidade, Long> {

    List<UsuarioUnidade> findByUsuarioId(Long usuarioId);

    Optional<UsuarioUnidade> findByUsuarioIdAndUnidadeCodigo(Long usuarioId, String codigoUnidade);
}
