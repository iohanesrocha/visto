# Segurança para produto SaaS vendido a terceiros

## Não negociar estes itens

1. **Múltiplas empresas:** uma única instalação pode ter milhares de empresas; `organization_id` e RLS em todas as tabelas. Validar acesso adversarial com contas A e B antes de qualquer cliente.
2. **Banco:** separar ambientes desenvolvimento/homologação/produção; backups testados, logs, segredos guardados em variáveis de ambiente; `service_role` nunca no navegador.
3. **Drive:** a pasta `_visto` atualmente tem permissão `anyone/writer`. **Remova essa permissão** antes de habilitar o fluxo de anexos; o código já recusa uploads quando a pasta raiz permite acesso público ou de domínio. Para clientes, são criadas pastas `org-UUID/documentos`; nenhum usuário final deve receber link de compartilhamento da raiz.
4. **Pessoas:** CPF, dados de saúde e certificações exigem minimização, prazo de retenção, acesso segregado e adequação LGPD. As planilhas amostrais não podem ser commitadas no GitHub.
5. **Cobrança:** a tabela `subscriptions` contém **trial de homologação**. Não confundir com checkout. Pagamentos deverão ser ativados somente por webhook validado/idempotente em backend, com contratos, notas fiscais e regras de cancelamento.
6. **Código e titularidade:** repositório privado controlado pela pessoa jurídica titular; branches protegidas, revisão de PR, CI e gestão de credenciais.
7. **Limites:** ampliar banco para limites por assinatura (usuários, arquivos, volume), rate limiting, proteção contra abuso, e-mail transacional, geração de relatórios e exportação.
8. **Testes:** autenticação, RLS, permissões, disponibilidade, restauração, isolamento de anexos, logs e recuperação de senha. Contratar auditoria técnica independente antes do lançamento.

## Sobre o login solicitado

A tela de login começa com `iohanesd@gmail.com` preenchido para facilitar o acesso. **Isto não cria conta nem concede privilégios.** O titular precisa cadastrar/confirmar o e-mail pelo Supabase Auth e configurar suas organizações. Nenhuma senha é criada ou armazenada neste repositório.

## Google Drive como armazenagem SaaS

O backend utiliza OAuth com refresh token da conta autorizada, guardado somente no servidor. Todos os anexos da interface são armazenados dentro de `GOOGLE_DRIVE_ROOT_FOLDER_ID`, por subpasta de empresa. **Não** são enviados diretamente pelo navegador ao Google Drive. Para comercialização em maior escala, recomenda-se migrar para um drive compartilhado gerido pela empresa ou um bucket privado por tenant/cliente, com fluxo de delegação/permissões formais e política de retenção.
