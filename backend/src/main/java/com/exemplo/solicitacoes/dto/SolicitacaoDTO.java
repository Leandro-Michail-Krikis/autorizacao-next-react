package com.exemplo.solicitacoes.dto;

import java.time.LocalDateTime;

public record SolicitacaoDTO(Long id, String titulo, String descricao, String status,
                             LocalDateTime dataCriacao, String codigoUnidade, String nomeUnidade) {
}
