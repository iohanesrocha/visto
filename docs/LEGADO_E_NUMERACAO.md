# Visto ERP · Conversão dos formulários legados

**Fonte:** arquivos XLSX enviados pelo proprietário em 29/10/2026. A migração usa **estruturas e cabeçalhos**, nunca os dados de funcionários ou clientes contidos nas amostras. Os Apps Scripts/HTML originais **não estão incluídos** em exportações XLSX.

| Código profissional | Nome Visto ERP | Identificação anterior | Tabela principal |
|---|---|---|---|
| OBR-PNL | Painel de Obras | Painel de Obras | Visão consolidada de `projects`, `planning_entries`, `production_entries`, `replanning_entries`, `monthly_targets` e `employees` |
| OBR-000 | Itens de Orçamento | Novo: cadastro de apoio necessário | `work_items` |
| OBR-001 | Diário de Obras | Form.Obr.01 | `daily_site_reports` |
| OBR-002 | Serviços Realizados | Form.Obr.02 | `production_entries` |
| OBR-003 | Planejamento Físico-financeiro | Form.Obr.03 | `planning_entries` |
| OBR-004 | Replanejamento | Form.Obr.04 | `replanning_entries` |
| OBR-005 | Metas Executivas | Form.Obr.05 | `monthly_targets` |
| ADM-004 | Transferência de Funcionário (R01) | Form.ADM.04 | `employee_transfers` |
| ADM-006 | Cadastro de Funcionários | Form.ADM.06 | `employees` |
| ADM-008L | Lista de Funcionários | Form.Adm.08 Lista | `employees` (somente leitura) |
| ADM-008P | Perfil de Funcionários | Form.Adm.08 Perfil | `employees` (lista sem dados sensíveis) |
| ADM-010 | Cadastro de Obras | Form.ADM.10 | `projects` e `project_details` |

## Regras preservadas e ampliadas

- **Empresa:** toda linha operacional carrega `organization_id`. O RLS valida organização e módulo contratado.
- **Realizado:** novos lançamentos entram como **pendente**; somente `owner/admin` decidem por RPC; apenas **aprovados** aparecem no Painel de Obras.
- **Planejado:** quantidades por data e item orçamentário, com valores derivados do preço do item por gatilho do banco; não se confunde com realizado.
- **Replanejado:** usa datas inicial/final e os marcadores de sábado/domingo. A versão implementada valida a existência de dias executáveis e grava o quantitativo total; **não faz rateio diário automático**. O planejamento original permanece intacto.
- **Metas:** por obra e competência mensal, via RPC com controle de privilégios e trilha de auditoria.
- **Transferências:** aprovação obrigatória e três checklist de documentos, EPI/Kit e logística antes de atualizar lotação.
- **Cadastro de Funcionários:** matrícula, função, lotação, ASO e certificações. CPF, datas pessoais e informações SST não aparecem em listagens básicas. Não inserir dados reais antes de validação de segurança/LGPD.
- **Ordens de Serviço:** campos de número, responsável técnico e ART no cadastro de obra.
- **Formulários sem estrutura exportada:** `Form.Obr.01`, `Form.Adm.08 Lista` e `Form.Adm.08 Perfil` possuem abas vazias nos XLSX; suas telas foram inferidas pela finalidade declarada, não recriadas de um HTML/Apps Script original.

## Fonte dos dados do antigo Painel de Obras

A exportação inclui guias com dados de obras, financeiro planejado/realizado, replanejamento, perfuração, efetivo, metas, veículos, OS, auditoria e acesso. **Não** foi importada a base bruta de funcionários, históricos financeiros, placas ou dados pessoais para o novo SaaS. Perfuração, frota e NC demandam ainda módulos específicos de domínio, com regras e tabelas próprias; a interface geral existente não significa que o cálculo original foi reproduzido integralmente.

## Próxima migração controlada

Elaborar ETL com mapeamento `obra antiga + contrato` para UUID novo, normalizar datas seriais Excel, desduplicar `ID`, validar itens e preços unitários, registrar proveniência e hashes e produzir relatório de conferência. Executar somente em projeto privado de homologação com autorização para os dados efetivamente utilizados. Nunca importar planilha de habilitados contendo senha legada em texto simples.
