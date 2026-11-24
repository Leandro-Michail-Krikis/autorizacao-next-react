package com.exemplo.solicitacoes.service;

import com.exemplo.solicitacoes.dto.PermissaoDTO;
import com.exemplo.solicitacoes.dto.PermissoesUnidadeResponse;
import com.exemplo.solicitacoes.dto.UnidadeDTO;
import com.exemplo.solicitacoes.entity.Unidade;
import com.exemplo.solicitacoes.entity.UsuarioUnidade;
import com.exemplo.solicitacoes.repository.UnidadeRepository;
import com.exemplo.solicitacoes.repository.UsuarioUnidadeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/** Apenas informa unidades e permissões. Não decide nada: quem autoriza é o BFF. */
@Service
public class AcessoService {

    private final UsuarioUnidadeRepository vinculoRepo;
    private final UnidadeRepository unidadeRepo;

    public AcessoService(UsuarioUnidadeRepository vinculoRepo, UnidadeRepository unidadeRepo) {
        this.vinculoRepo = vinculoRepo;
        this.unidadeRepo = unidadeRepo;
    }

    public List<UnidadeDTO> unidadesDoUsuario(Long codigoUsuario) {
        return vinculoRepo.findByUsuarioId(codigoUsuario).stream()
                .map(UsuarioUnidade::getUnidade)
                .map(u -> new UnidadeDTO(u.getId(), u.getCodigo(), u.getNome()))
                .sorted(Comparator.comparing(UnidadeDTO::codigo))
                .toList();
    }

    /** Sem vínculo com a unidade, devolve lista de permissões vazia (200). */
    public PermissoesUnidadeResponse permissoes(Long codigoUsuario, String codigoUnidade) {
        Unidade unidade = unidadeRepo.findByCodigo(codigoUnidade)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidade não encontrada"));

        List<PermissaoDTO> permissoes = vinculoRepo.findByUsuarioIdAndUnidadeCodigo(codigoUsuario, codigoUnidade)
                .map(v -> v.getPermissoes().stream()
                        .sorted()
                        .map(p -> new PermissaoDTO(p.name(), p.getDescricao()))
                        .toList())
                .orElse(List.of());

        return new PermissoesUnidadeResponse(unidade.getCodigo(), unidade.getNome(), permissoes);
    }
}
