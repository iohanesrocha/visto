# Visto ERP — roteiro de homologação antes do primeiro cliente

Este documento não substitui teste de segurança e privacidade por equipe independente.

## Checagens técnicas

- [ ] `npm install`, `npm run typecheck`, `npm run lint` e `npm run build` executam sem erro.
- [ ] SQL 001 seguido do SQL 002 em **projeto novo** termina sem erros.
- [ ] O módulo `module_records` tem RLS habilitado.
- [ ] A aplicação não possui `service_role` nem outras credenciais privadas expostas ao cliente.
- [ ] E-mail de confirmação, callback e login são validados.

## Testes multiempresa (obrigatórios)

1. Criar **Empresa A** com Usuário A e **Empresa B** com Usuário B.
2. Com A: criar obra e registro Financeiro com valores fictícios.
3. Com B: confirmar que A não aparece em nenhuma consulta, busca ou contagem.
4. Com B: tentar `SELECT`/`UPDATE`/`DELETE` dos IDs de A por acesso direto à API com seu token de autenticação: deve ser negado pelo RLS.
5. Desabilitar Financeiro na Empresa A e confirmar que a consulta e a gravação de registros financeiros se tornam indisponíveis.
6. Exaurir/expirar uma assinatura de teste e verificar que os módulos operacionais não retornam dados.
7. Testar convites expirados, token reutilizado, e-mail divergente e limite de usuários.
8. Verificar que usuário `member` não consegue gerar convites ou alterar módulo/assinatura.
9. Conferir que alteração de status de um registro da Empresa B não modifica registros da Empresa A.

## Fluxos de uso

- [ ] Menu lateral expande/recolhe e item ativo corresponde à página atual.
- [ ] Barra de busca filtra e abre as páginas encontradas.
- [ ] Layout funciona no mobile, com drawer que fecha ao navegar.
- [ ] Obras: cadastro, listagem, atualização e acesso limitado por licença.
- [ ] Registro genérico: cadastro, pesquisa por título, atualização de status e auditoria.
- [ ] Organização: seleção de empresas e saída.
- [ ] Auditoria: apenas proprietário/administrador visualiza logs.

## Impedimentos comerciais até resolver

- [ ] Cobrança recorrente por provedor, webhooks autenticados e idempotência.
- [ ] Política de privacidade, LGPD, termos e suporte definidos.
- [ ] Backup externo e restauração testada.
- [ ] Mecanismos antiabuso, monitoramento, limites e rate limiting.
- [ ] Módulos fiscais e contábeis homologados por especialistas: a tela atual **não** é escrituração oficial.
