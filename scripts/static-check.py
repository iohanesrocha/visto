from pathlib import Path
root=Path(__file__).resolve().parents[1]
required=[
 'package.json','app/page.tsx','app/actions.ts','app/erp/page.tsx',
 'app/erp/[organizationId]/obras/page.tsx',
 'app/erp/[organizationId]/usuarios/page.tsx',
 'app/erp/[organizationId]/modulos/page.tsx',
 'app/api/convites/route.ts','sql/001_initial.sql','lib/supabase/server.ts',
]
for f in required:
    assert (root/f).exists(),f'Missing {f}'
sql=(root/'sql/001_initial.sql').read_text()
for table in ['organizations','organization_members','profiles','projects','invitations','subscriptions','organization_modules','audit_logs']:
    assert f'alter table public.{table} enable row level security' in sql,table
for func in ['create_organization','accept_invitation','toggle_org_module','can_use_module']:
    assert f'function public.{func}' in sql,func
for private in ['SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SECRET_KEY']:
    assert private not in (root/'.env.example').read_text(),private
assert '.env*' in (root/'.gitignore').read_text()
print('Static checks passed: file structure, RLS baseline and environment template.')
