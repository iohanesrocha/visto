# Visto ERP — plataforma SaaS multiempresa

ERP comercial modular, com autenticação e banco Supabase, frontend Next.js, código GitHub, hospedagem Vercel e GED com integração Google Drive no servidor.

**Status:** MVP técnico para homologação, não produto pronto para venda, faturamento fiscal ou escrituração contábil.

## Estrutura

- `app/`: rotas Next.js, autenticação, dashboard, administração, módulos, formulários e GED.
- `components/shell/`: layout corporativo com menu lateral, topbar, busca, tema e responsividade.
- `lib/forms/catalog.ts`: fonte única dos formulários, códigos e campos.
- `app/erp/form-actions.ts`: gravação/validação segura em servidor.
- `app/erp/[organizationId]/painel-obras`: painel físico-financeiro com dados reais da organização, apenas realizados aprovados.
- `app/erp/[organizationId]/formularios/[code]`: formulário e listagem de cada documento.
- `app/api/arquivos/route.ts`: upload de anexos ao Google Drive por organização.
- `sql/`: migrações incrementais, RLS, auditoria e domínio de obras/colaboradores.
- `docs/LEGADO_E_NUMERACAO.md`: matriz dos 11 XLSX e numeração profissional.
- `docs/SEGURANCA_E_COMERCIAL.md`: limites de segurança e roteiro comercial.
- `DEPLOY_GITHUB.md`: publicação específica no GitHub `iohanesrocha/visto`.

## Formulários

OBR-PNL Painel | OBR-000 Orçamento | OBR-001 Diário | OBR-002 Realizado | OBR-003 Planejado | OBR-004 Replanejado | OBR-005 Metas | ADM-004 Transferência | ADM-006 Funcionários | ADM-008L Lista | ADM-008P Perfil | ADM-010 Obras.

## Instalação rápida

1. Copie `.env.example` para `.env.local` e configure o projeto Supabase.
2. Rode em ordem `sql/001_initial.sql` até `sql/005_platform_admin.sql` em projeto novo.
3. Execute `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev`.
4. Cadastre o e-mail do titular no Supabase Auth e confirme e-mail. O login inicia com `iohanesd@gmail.com`, sem senha pré-criada.
5. Para anexos, restrinja primeiro o compartilhamento da pasta Google Drive, depois configure OAuth no backend.
6. Para produção, consulte `docs/SEGURANCA_E_COMERCIAL.md` e `TESTE_HOMOLOGACAO.md`.

### Garantias e limitações

- `organization_id` e RLS para tenant; admin/owner aprovam realizado e transferências.
- Preços/valores de lançamentos obtidos de itens orçamentários, calculados por gatilhos PostgreSQL.
- Os formulários original `Diário de Obras`, `Lista` e `Perfil` não continham estruturas internas no XLSX e foram modelados pela finalidade indicada; **não são uma cópia do Apps Script original**.
- Layout baseado nas imagens fornecidas. O endereço da Altiplano é SPA dinâmica, sem conteúdo interno legível sem autenticação; não foi acessado nem copiado seu código privado.
- As planilhas com dados reais **não estão incluídas neste repositório/ZIP**.
- Ainda faltam fechamento contábil/fiscal, cobranças, gateway, importação ETL homologada, relatórios avançados, perfuração e frota, testes reais de RLS e gestão documental enterprise.
