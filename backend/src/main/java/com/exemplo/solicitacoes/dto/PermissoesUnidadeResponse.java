package com.exemplo.solicitacoes.dto;

import java.util.List;

public record PermissoesUnidadeResponse(String codigoUnidade, String nomeUnidade, List<PermissaoDTO> permissoes) {
}
