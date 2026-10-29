# Implantação do Visto ERP em `iohanesrocha/visto`

**Situação de 29/10/2026:** integração GitHub retornou **404** para `iohanesrocha/visto` e não tem instalação reconhecida. Nenhuma modificação foi publicada. É necessário autorizar o aplicativo GitHub na conta/repositório ou usar Git local autenticado.

## GitHub

Se o repositório existente estiver **vazio**, extraia o ZIP e execute, dentro da pasta que contém `package.json`:

```bash
git init
git branch -M main
git add .
git commit -m "feat: Visto ERP SaaS multiempresa + Obras + RH + GED"
git remote add origin https://github.com/iohanesrocha/visto.git
git push -u origin main
```

**Se o repositório já possui código, NÃO execute o bloco anterior.** Clone primeiro, compare arquivos, crie uma branch `feature/visto-saas` e abra PR com revisão e backup. Não sobrescreva a branch `main` nem publique arquivos `.env.local`, planilhas de funcionários ou segredos.

## Supabase

Crie um projeto **novo e privado** e execute as migrações em ordem pelo SQL Editor:

1. `sql/001_initial.sql`
2. `sql/002_operational_modules.sql`
3. `sql/003_obras_rh.sql`
4. `sql/004_security_and_audit.sql`
5. `sql/005_platform_admin.sql` (painel operador; ative o usuário administrador conforme comentário no próprio SQL)

Configure Supabase Auth (e-mail confirmado, Site URL e Redirect URLs). Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_APP_URL` de `.env.example` no projeto Vercel.

## Google Drive

1. Na pasta `_visto`, remova o compartilhamento com **qualquer pessoa/editor**.
2. Registre no Google Cloud um aplicativo OAuth interno e autorize a conta proprietária para gravar na pasta, com escopo mínimo aplicável.
3. Configure **somente no servidor** `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
4. Teste upload com um PDF sem dados pessoais e confirme a existência de `org-UUID/documentos`.
5. Em produção, implemente reprocessamento de falha entre arquivo enviado ao Drive e cadastro em `file_registry` (a primeira versão pode deixar um arquivo órfão se a transação falhar).

## Node e deploy

Use Node.js LTS compatível com Next 16, depois:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Publique na Vercel conectada ao repositório privado. **Não habilite cobranças de clientes reais** até concluir os testes e o gateway de cobrança por webhooks.
