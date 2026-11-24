package com.exemplo.solicitacoes.entity;

import jakarta.persistence.*;

import java.util.EnumSet;
import java.util.Set;

/** Vínculo usuário x unidade, com as permissões que o usuário tem naquela unidade. */
@Entity
@Table(name = "usuario_unidade",
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "unidade_id"}))
public class UsuarioUnidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "unidade_id")
    private Unidade unidade;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_unidade_permissao",
            joinColumns = @JoinColumn(name = "usuario_unidade_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permissao")
    private Set<Permissao> permissoes = EnumSet.noneOf(Permissao.class);

    public UsuarioUnidade() {}

    public UsuarioUnidade(Usuario usuario, Unidade unidade, Set<Permissao> permissoes) {
        this.usuario = usuario;
        this.unidade = unidade;
        this.permissoes = permissoes;
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public Unidade getUnidade() { return unidade; }
    public Set<Permissao> getPermissoes() { return permissoes; }
}
