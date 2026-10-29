"""Checagens estáticas rápidas da integridade do pacote (não substituem npm build nem testes RLS)."""
from pathlib import Path
import re
base=Path(__file__).resolve().parents[1]
required=[
 'package.json','app/erp/[organizationId]/layout.tsx',
 'components/shell/app-shell.tsx','lib/navigation.ts',
 'sql/001_initial.sql','sql/002_operational_modules.sql',
 'app/erp/operational-actions.ts',
 'app/erp/[organizationId]/operacional/[module]/[screen]/page.tsx',
 '.github/workflows/check.yml','DEPLOY_GITHUB.md'
]
missing=[p for p in required if not (base/p).exists()]
assert not missing, f'Arquivos ausentes: {missing}'
menu=(base/'lib/navigation.ts').read_text()
for module in ['gerencial','administracao','cadastros','financeiro','suprimentos','fiscal','patrimonio','frota','diario-obra','alojamentos','contabilidade','qsms']:
    assert f"slug:'{module}'" in menu, f'Módulo ausente do menu: {module}'
    assert f"'{module}'" in (base/'sql/002_operational_modules.sql').read_text(), f'Módulo ausente do banco: {module}'
base_files=list(base.rglob('*'))
assert len(base_files)>40, 'Pacote inesperadamente pequeno'
print(f'OK: {len(required)} componentes essenciais, 12 grupos de menu, {sum(x.is_file() for x in base_files)} arquivos.')
