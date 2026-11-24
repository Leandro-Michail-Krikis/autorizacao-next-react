package com.exemplo.solicitacoes.controller;

import com.exemplo.solicitacoes.dto.PermissoesUnidadeResponse;
import com.exemplo.solicitacoes.dto.UnidadeDTO;
import com.exemplo.solicitacoes.service.AcessoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios/{codigoUsuario}")
public class UsuarioController {

    private final AcessoService acessoService;

    public UsuarioController(AcessoService acessoService) {
        this.acessoService = acessoService;
    }

    /** Unidades disponíveis para o usuário. */
    @GetMapping("/unidades")
    public List<UnidadeDTO> unidades(@PathVariable Long codigoUsuario) {
        return acessoService.unidadesDoUsuario(codigoUsuario);
    }

    /** Permissões (A, B, C, D) do usuário em uma unidade. */
    @GetMapping("/unidades/{codigoUnidade}/permissoes")
    public PermissoesUnidadeResponse permissoes(@PathVariable Long codigoUsuario,
                                                @PathVariable String codigoUnidade) {
        return acessoService.permissoes(codigoUsuario, codigoUnidade);
    }
}
