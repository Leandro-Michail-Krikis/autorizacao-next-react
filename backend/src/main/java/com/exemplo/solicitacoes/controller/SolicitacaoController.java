package com.exemplo.solicitacoes.controller;

import com.exemplo.solicitacoes.dto.SolicitacaoDTO;
import com.exemplo.solicitacoes.dto.SolicitacaoRequest;
import com.exemplo.solicitacoes.service.SolicitacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sem controle de autorização: o BFF é quem valida permissões.
 * A unidade chega por param (listagem) ou pelo header X-Unidade-Selecionada (escrita).
 */
@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {

    private static final String HEADER_UNIDADE = "X-Unidade-Selecionada";

    private final SolicitacaoService service;

    public SolicitacaoController(SolicitacaoService service) {
        this.service = service;
    }

    @GetMapping
    public List<SolicitacaoDTO> listar(@RequestParam String codigoUnidade) {
        return service.listar(codigoUnidade);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoDTO criar(@RequestHeader(HEADER_UNIDADE) String codigoUnidade,
                                @Valid @RequestBody SolicitacaoRequest req) {
        return service.criar(codigoUnidade, req);
    }

    @PutMapping("/{id}")
    public SolicitacaoDTO editar(@PathVariable Long id,
                                 @RequestHeader(HEADER_UNIDADE) String codigoUnidade,
                                 @Valid @RequestBody SolicitacaoRequest req) {
        return service.editar(id, codigoUnidade, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id,
                        @RequestHeader(HEADER_UNIDADE) String codigoUnidade) {
        service.excluir(id, codigoUnidade);
    }
}
