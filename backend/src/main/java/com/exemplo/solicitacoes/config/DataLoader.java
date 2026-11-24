package com.exemplo.solicitacoes.config;

import com.exemplo.solicitacoes.entity.*;
import com.exemplo.solicitacoes.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;

/** Carrega dados de exemplo ao subir a aplicação. */
@Component
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepo;
    private final UnidadeRepository unidadeRepo;
    private final UsuarioUnidadeRepository usuarioUnidadeRepo;
    private final SolicitacaoRepository solicitacaoRepo;
    private final PasswordEncoder encoder;

    public DataLoader(UsuarioRepository usuarioRepo, UnidadeRepository unidadeRepo,
                      UsuarioUnidadeRepository usuarioUnidadeRepo, SolicitacaoRepository solicitacaoRepo,
                      PasswordEncoder encoder) {
        this.usuarioRepo = usuarioRepo;
        this.unidadeRepo = unidadeRepo;
        this.usuarioUnidadeRepo = usuarioUnidadeRepo;
        this.solicitacaoRepo = solicitacaoRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        // Unidades
        Unidade sp = unidadeRepo.save(new Unidade("SP01", "Unidade São Paulo"));
        Unidade rj = unidadeRepo.save(new Unidade("RJ01", "Unidade Rio de Janeiro"));
        Unidade mg = unidadeRepo.save(new Unidade("MG01", "Unidade Minas Gerais"));
        Unidade sc = unidadeRepo.save(new Unidade("SC01", "Unidade Santa Catarina"));

        // Usuários (senha: 123456)
        Usuario admin = usuarioRepo.save(new Usuario("admin", encoder.encode("123456"), "Administrador"));
        Usuario maria = usuarioRepo.save(new Usuario("maria", encoder.encode("123456"), "Maria Silva"));
        Usuario joao = usuarioRepo.save(new Usuario("joao", encoder.encode("123456"), "João Souza"));

        // Permissões por unidade (A=Visualizar, B=Criar, C=Editar, D=Excluir)
        usuarioUnidadeRepo.save(new UsuarioUnidade(admin, sp, EnumSet.of(Permissao.A, Permissao.B, Permissao.C, Permissao.D)));
        usuarioUnidadeRepo.save(new UsuarioUnidade(admin, rj, EnumSet.of(Permissao.A, Permissao.B, Permissao.C, Permissao.D)));
        usuarioUnidadeRepo.save(new UsuarioUnidade(admin, mg, EnumSet.of(Permissao.A, Permissao.B, Permissao.C, Permissao.D)));
        usuarioUnidadeRepo.save(new UsuarioUnidade(admin, sc, EnumSet.of(Permissao.A, Permissao.B, Permissao.C, Permissao.D)));

        usuarioUnidadeRepo.save(new UsuarioUnidade(maria, sp, EnumSet.of(Permissao.A, Permissao.B)));
        usuarioUnidadeRepo.save(new UsuarioUnidade(maria, mg, EnumSet.of(Permissao.A, Permissao.B, Permissao.C)));

        usuarioUnidadeRepo.save(new UsuarioUnidade(joao, rj, EnumSet.of(Permissao.A)));
        usuarioUnidadeRepo.save(new UsuarioUnidade(joao, sc, EnumSet.of(Permissao.A, Permissao.C, Permissao.D)));

        // Solicitações
        LocalDateTime agora = LocalDateTime.now();
        solicitacaoRepo.save(new Solicitacao("Compra de notebooks", "Reposição de 10 notebooks", "ABERTA", agora.minusDays(5), sp));
        solicitacaoRepo.save(new Solicitacao("Manutenção do ar-condicionado", "Sala 302 sem refrigeração", "EM_ANDAMENTO", agora.minusDays(3), sp));
        solicitacaoRepo.save(new Solicitacao("Acesso à VPN", "Liberar VPN para novo colaborador", "CONCLUIDA", agora.minusDays(10), rj));
        solicitacaoRepo.save(new Solicitacao("Troca de mobiliário", "Cadeiras ergonômicas", "ABERTA", agora.minusDays(1), rj));
        solicitacaoRepo.save(new Solicitacao("Reforma do almoxarifado", "Prateleiras novas", "EM_ANDAMENTO", agora.minusDays(7), mg));
        solicitacaoRepo.save(new Solicitacao("Licenças de software", "Renovação anual das licenças", "ABERTA", agora.minusDays(2), mg));
        solicitacaoRepo.save(new Solicitacao("Internet instável", "Link com quedas frequentes", "ABERTA", agora.minusHours(8), sc));
    }
}
