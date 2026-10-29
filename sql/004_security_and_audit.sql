-- Visto ERP | 004 | Hardening de permissões e auditoria
-- Executar após 001, 002 e 003.
-- Não alterar os direitos de cliente/sócio sem revisão de segurança em homologação.

-- Cadastro de obra: membros visualizam, mas somente administradores alteram.
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
 using(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras'))
 with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras'));
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
 with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras') and created_by=auth.uid());

-- Rotina genérica de auditoria sem copiar dados pessoais ou corpos de documentos.
create function public.audit_business_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare oid uuid; rid uuid;
begin
 oid=coalesce(new.organization_id,old.organization_id);
 rid=coalesce(new.id,old.id);
 insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data)
 values (oid,auth.uid(),TG_OP,TG_TABLE_NAME,rid,'{}'::jsonb);
 return coalesce(new,old);
end; $$;
create trigger audit_employees after insert or update on public.employees for each row execute function public.audit_business_change();
create trigger audit_planning after insert or update on public.planning_entries for each row execute function public.audit_business_change();
create trigger audit_actual after insert or update on public.production_entries for each row execute function public.audit_business_change();
create trigger audit_replans after insert or update on public.replanning_entries for each row execute function public.audit_business_change();
create trigger audit_transfers after insert or update on public.employee_transfers for each row execute function public.audit_business_change();
create trigger audit_daily after insert or update on public.daily_site_reports for each row execute function public.audit_business_change();
create trigger audit_files after insert or update on public.file_registry for each row execute function public.audit_business_change();

-- Impede que membros comuns editem o autor, tenant, datas e cálculos de obras existentes.
revoke update on public.projects from authenticated;
grant update(name,code,status,budget_cents,updated_at) on public.projects to authenticated;

-- RLS da produção: sem políticas de update direto, somente RPC de aprovação (security definer).
-- Limites de assinaturas reais, faturamento e controles antispam precisam ser implementados antes da venda.
