package com.exemplo.solicitacoes.entity;

public enum Permissao {
    A("Visualizar"),
    B("Criar"),
    C("Editar"),
    D("Excluir");

    private final String descricao;

    Permissao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
