package com.exemplo.solicitacoes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SolicitacaoRequest(
        @NotBlank @Size(max = 255) String titulo,
        @Size(max = 1000) String descricao,
        @NotBlank @Pattern(regexp = "ABERTA|EM_ANDAMENTO|CONCLUIDA",
                message = "status deve ser ABERTA, EM_ANDAMENTO ou CONCLUIDA") String status) {
}
