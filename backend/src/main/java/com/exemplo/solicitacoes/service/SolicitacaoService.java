package com.exemplo.solicitacoes.service;

import com.exemplo.solicitacoes.dto.SolicitacaoDTO;
import com.exemplo.solicitacoes.dto.SolicitacaoRequest;
import com.exemplo.solicitacoes.entity.Solicitacao;
import com.exemplo.solicitacoes.entity.Unidade;
import com.exemplo.solicitacoes.repository.SolicitacaoRepository;
import com.exemplo.solicitacoes.repository.UnidadeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SolicitacaoService {

    private final SolicitacaoRepository repo;
    private final UnidadeRepository unidadeRepo;

    public SolicitacaoService(SolicitacaoRepository repo, UnidadeRepository unidadeRepo) {
        this.repo = repo;
        this.unidadeRepo = unidadeRepo;
    }

    public List<SolicitacaoDTO> listar(String codigoUnidade) {
        return repo.findByUnidadeCodigoOrderByDataCriacaoDesc(codigoUnidade).stream()
                .map(SolicitacaoService::toDto)
                .toList();
    }

    public SolicitacaoDTO criar(String codigoUnidade, SolicitacaoRequest req) {
        Unidade unidade = unidadeRepo.findByCodigo(codigoUnidade)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidade não encontrada"));
        Solicitacao nova = new Solicitacao(req.titulo(), req.descricao(), req.status(), LocalDateTime.now(), unidade);
        return toDto(repo.save(nova));
    }

    public SolicitacaoDTO editar(Long id, String codigoUnidade, SolicitacaoRequest req) {
        Solicitacao s = buscar(id, codigoUnidade);
        s.atualizar(req.titulo(), req.descricao(), req.status());
        return toDto(repo.save(s));
    }

    public void excluir(Long id, String codigoUnidade) {
        repo.delete(buscar(id, codigoUnidade));
    }

    /** A solicitação precisa pertencer à unidade informada no header (escopo de dados, não de permissão). */
    private Solicitacao buscar(Long id, String codigoUnidade) {
        return repo.findByIdAndUnidadeCodigo(id, codigoUnidade)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Solicitação não encontrada nesta unidade"));
    }

    private static SolicitacaoDTO toDto(Solicitacao s) {
        return new SolicitacaoDTO(s.getId(), s.getTitulo(), s.getDescricao(), s.getStatus(),
                s.getDataCriacao(), s.getUnidade().getCodigo(), s.getUnidade().getNome());
    }
}
