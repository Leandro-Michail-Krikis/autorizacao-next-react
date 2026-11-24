# Back-end (Spring Boot + H2) — sem autorização

Java 17+ e Maven 3.9+:   mvn spring-boot:run   (porta 8080)
Console H2: http://localhost:8080/h2-console  (jdbc:h2:mem:solicitacoesdb, sa, senha vazia)

O back NÃO gera token e NÃO autoriza nada. Só confirma credenciais e informa unidades/permissões.
Quem autoriza é o BFF (Next.js). Por isso, não exponha a porta 8080 fora da rede do BFF.

POST   /api/auth/login                                          {login, senha} -> {codigoUsuario, login, nome} | 401
GET    /api/usuarios/{codigoUsuario}/unidades
GET    /api/usuarios/{codigoUsuario}/unidades/{codigoUnidade}/permissoes
GET    /api/solicitacoes?codigoUnidade=SP01
POST   /api/solicitacoes          header X-Unidade-Selecionada   {titulo, descricao, status}
PUT    /api/solicitacoes/{id}     header X-Unidade-Selecionada   {titulo, descricao, status}
DELETE /api/solicitacoes/{id}     header X-Unidade-Selecionada

status: ABERTA | EM_ANDAMENTO | CONCLUIDA
Usuários (senha 123456): admin (ABCD em todas), maria (SP01 AB, MG01 ABC), joao (RJ01 A, SC01 ACD)
