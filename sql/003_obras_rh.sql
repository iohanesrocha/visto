-- Visto ERP | 003 | Domínios Obras, Pessoas, Documentos e Metas
-- Executar DEPOIS de 001 e 002, em banco NOVO de homologação.
-- Nenhum dado de funcionários das planilhas é importado por esta migração.

-- Detalhes contratuais, ambientais e técnicos (mantidos fora do cadastro básico de obras).
create table if not exists public.project_details (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_name text,
  contract_number text,
  contracting_manager text,
  designer text,
  description text,
  location text,
  start_date date,
  end_date date,
  technical_manager text,
  art_number text,
  service_order_number text,
  service_order_date date,
  service_order_drive_file_id text,
  environmental_protection_area boolean not null default false,
  worksite_type text,
  slope_height_m numeric(14,3),
  work_length_m numeric(14,3),
  updated_at timestamptz not null default now(),
  unique(organization_id,project_id)
);
create index if not exists project_details_org_idx on public.project_details(organization_id);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_number text not null,
  name text not null check(length(btrim(name)) between 2 and 160),
  role_title text,
  role_level text,
  cpf text, -- RESTRITO: nunca enviar este campo para logs/telemetria
  admission_date date,
  birth_date date,
  current_project_id uuid references public.projects(id) on delete set null,
  status text not null default 'ativo' check(status in ('ativo','inativo','afastado')),
  medical_exam_expires_on date,
  rope_access_level text,
  rope_access_expires_on date,
  safety_training_expires_on date,
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,employee_number),
  unique(organization_id,id)
);
create index if not exists employees_org_status_idx on public.employees(organization_id,status);

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item_code text not null,
  description text not null,
  unit text not null default 'un',
  unit_price_cents bigint not null default 0 check(unit_price_cents>=0),
  budget_quantity numeric(18,5) not null default 0 check(budget_quantity>=0),
  active boolean not null default true,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(organization_id,project_id,item_code),
  unique(organization_id,id)
);
create index if not exists work_items_project_idx on public.work_items(organization_id,project_id);

create table if not exists public.planning_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id),
  work_date date not null,
  quantity numeric(18,5) not null check(quantity>0),
  amount_cents bigint not null default 0,
  note text,
  is_baseline boolean not null default false,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(organization_id,id)
);
create index if not exists planning_org_date_idx on public.planning_entries(organization_id,project_id,work_date);

create table if not exists public.production_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id),
  work_date date not null,
  quantity_service numeric(18,5) not null default 0 check(quantity_service>=0),
  quantity_supply numeric(18,5) not null default 0 check(quantity_supply>=0),
  quantity numeric(18,5) generated always as (quantity_service+quantity_supply) stored,
  amount_cents bigint not null default 0,
  status text not null default 'pendente' check(status in ('pendente','aprovado','rejeitado')),
  note text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  rejection_reason text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(organization_id,id),
  constraint production_positive check(quantity_service+quantity_supply>0)
);
create index if not exists production_org_date_idx on public.production_entries(organization_id,project_id,work_date,status);

create table if not exists public.replanning_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id),
  start_date date not null,
  end_date date not null,
  include_saturday boolean not null default false,
  include_sunday boolean not null default false,
  revised_quantity numeric(18,5) not null check(revised_quantity>0),
  revised_amount_cents bigint not null default 0,
  reason text not null check(length(btrim(reason)) between 3 and 2000),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  check(end_date >= start_date),
  check(end_date <= start_date + 366),
  unique(organization_id,id)
);
create index if not exists replanning_org_idx on public.replanning_entries(organization_id,project_id,start_date);

create table if not exists public.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  month date not null check(extract(day from month)=1),
  target_cents bigint not null check(target_cents>=0),
  created_by uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  unique(organization_id,project_id,month)
);

create table if not exists public.daily_site_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  report_date date not null,
  weather text,
  headcount integer check(headcount>=0),
  activities text not null,
  occurrences text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(organization_id,project_id,report_date)
);

create table if not exists public.employee_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  from_project_id uuid references public.projects(id),
  to_project_id uuid not null references public.projects(id),
  effective_date date not null,
  checklist_docs boolean not null default false,
  checklist_ppe boolean not null default false,
  checklist_logistics boolean not null default false,
  notes text,
  status text not null default 'pendente' check(status in ('pendente','aprovado','rejeitado')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.file_registry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check(size_bytes between 1 and 10485760),
  provider text not null default 'google_drive' check(provider='google_drive'),
  drive_file_id text not null,
  drive_folder_id text not null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists file_registry_org_idx on public.file_registry(organization_id,created_at desc);

-- Integridade multiempresa: referências cruzadas não podem apontar para outra organização.
create or replace function public.enforce_tenant_references()
returns trigger language plpgsql set search_path='' as $$
begin
 if TG_TABLE_NAME='project_details' then
   if not exists(select 1 from public.projects p where p.id=new.project_id and p.organization_id=new.organization_id) then raise exception 'Obra fora da empresa'; end if;
 elsif TG_TABLE_NAME in ('planning_entries','production_entries','replanning_entries') then
   if not exists(select 1 from public.work_items w where w.id=new.work_item_id and w.project_id=new.project_id and w.organization_id=new.organization_id) then raise exception 'Item fora da empresa/obra'; end if;
 elsif TG_TABLE_NAME='employees' then
   if new.current_project_id is not null and not exists(select 1 from public.projects p where p.id=new.current_project_id and p.organization_id=new.organization_id) then raise exception 'Obra do funcionário fora da empresa'; end if;
 elsif TG_TABLE_NAME='employee_transfers' then
   if not exists(select 1 from public.employees e where e.id=new.employee_id and e.organization_id=new.organization_id) then raise exception 'Funcionário fora da empresa'; end if;
   if new.from_project_id is not null and not exists(select 1 from public.projects p where p.id=new.from_project_id and p.organization_id=new.organization_id) then raise exception 'Obra origem inválida'; end if;
   if not exists(select 1 from public.projects p where p.id=new.to_project_id and p.organization_id=new.organization_id) then raise exception 'Obra destino inválida'; end if;
 else
   if new.project_id is not null and not exists(select 1 from public.projects p where p.id=new.project_id and p.organization_id=new.organization_id) then raise exception 'Obra fora da empresa'; end if;
 end if;
 return new;
end; $$;

create or replace function public.compute_item_amount()
returns trigger language plpgsql set search_path='' as $$
declare p bigint;
begin
 select w.unit_price_cents into p from public.work_items w where w.id=new.work_item_id and w.project_id=new.project_id and w.organization_id=new.organization_id;
 if p is null then raise exception 'Item de orçamento inexistente na obra'; end if;
 if TG_TABLE_NAME='planning_entries' then
   new.amount_cents=round(new.quantity*p)::bigint;
 elsif TG_TABLE_NAME='production_entries' then
   new.amount_cents=round((new.quantity_service+new.quantity_supply)*p)::bigint;
 else
   new.revised_amount_cents=round(new.revised_quantity*p)::bigint;
   if not exists(select 1 from generate_series(new.start_date,new.end_date,interval '1 day') as d where
     (extract(isodow from d)::integer between 1 and 5)
     or (extract(isodow from d)::integer=6 and new.include_saturday)
     or (extract(isodow from d)::integer=7 and new.include_sunday)) then
      raise exception 'Período sem dia de execução';
   end if;
 end if;
 return new;
end; $$;

-- Restrição para que o status nunca seja autoaprovado pelo cliente.
create or replace function public.block_direct_decisions()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.status <> 'pendente' or new.decided_by is not null or new.decided_at is not null
   then raise exception 'Aprovação deve ocorrer pela função de decisão'; end if;
 return new;
end; $$;

create trigger project_details_tenant before insert or update on public.project_details for each row execute function public.enforce_tenant_references();
create trigger employees_project_tenant before insert or update on public.employees for each row execute function public.enforce_tenant_references();
create trigger work_items_tenant before insert or update on public.work_items for each row execute function public.enforce_tenant_references();
create trigger planning_tenant before insert or update on public.planning_entries for each row execute function public.enforce_tenant_references();
create trigger production_tenant before insert or update on public.production_entries for each row execute function public.enforce_tenant_references();
create trigger replan_tenant before insert or update on public.replanning_entries for each row execute function public.enforce_tenant_references();
create trigger targets_tenant before insert or update on public.monthly_targets for each row execute function public.enforce_tenant_references();
create trigger daily_tenant before insert or update on public.daily_site_reports for each row execute function public.enforce_tenant_references();
create trigger transfers_tenant before insert or update on public.employee_transfers for each row execute function public.enforce_tenant_references();
create trigger files_tenant before insert or update on public.file_registry for each row execute function public.enforce_tenant_references();
create trigger planning_amount before insert or update of quantity,work_item_id on public.planning_entries for each row execute function public.compute_item_amount();
create trigger actual_amount before insert or update of quantity_service,quantity_supply,work_item_id on public.production_entries for each row execute function public.compute_item_amount();
create trigger replan_amount before insert or update of revised_quantity,work_item_id on public.replanning_entries for each row execute function public.compute_item_amount();
create trigger actual_pending before insert on public.production_entries for each row execute function public.block_direct_decisions();
create trigger transfer_pending before insert on public.employee_transfers for each row execute function public.block_direct_decisions();

-- RPCs atômicos: decisão aprova/recusa uma única vez, com trilha de auditoria.
create function public.decide_production(p_id uuid,p_approved boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v public.production_entries%rowtype;
begin
 select * into v from public.production_entries where id=p_id for update;
 if not found or not public.is_org_manager(v.organization_id) or not public.can_use_module(v.organization_id,'obras') then raise exception 'Sem acesso'; end if;
 if v.status<>'pendente' then raise exception 'Registro já decidido'; end if;
 if not p_approved and length(btrim(coalesce(p_reason,'')))<3 then raise exception 'Informe o motivo da recusa'; end if;
 update public.production_entries set status=case when p_approved then 'aprovado' else 'rejeitado' end,decided_by=auth.uid(),decided_at=now(),rejection_reason=case when p_approved then null else p_reason end where id=p_id;
 insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data) values(v.organization_id,auth.uid(),case when p_approved then 'APROVAR' else 'REJEITAR' end,'production_entries',p_id,jsonb_build_object('status',case when p_approved then 'aprovado' else 'rejeitado' end));
end; $$;

create function public.decide_transfer(p_id uuid,p_approved boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v public.employee_transfers%rowtype;
begin
 select * into v from public.employee_transfers where id=p_id for update;
 if not found or not public.is_org_manager(v.organization_id) or not public.can_use_module(v.organization_id,'cadastros') then raise exception 'Sem acesso'; end if;
 if v.status<>'pendente' then raise exception 'Transferência já decidida'; end if;
 if p_approved and not (v.checklist_docs and v.checklist_ppe and v.checklist_logistics) then raise exception 'Checklist incompleto'; end if;
 update public.employee_transfers set status=case when p_approved then 'aprovado' else 'rejeitado' end,decided_by=auth.uid(),decided_at=now() where id=p_id;
 if p_approved then update public.employees set current_project_id=v.to_project_id,updated_at=now() where id=v.employee_id and organization_id=v.organization_id; end if;
 insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data) values(v.organization_id,auth.uid(),case when p_approved then 'APROVAR' else 'REJEITAR' end,'employee_transfers',p_id,jsonb_build_object('status',case when p_approved then 'aprovado' else 'rejeitado' end));
end; $$;

create function public.register_project(p_org uuid,p_name text,p_code text,p_budget bigint,p_client text,p_contract text,p_description text,p_location text,p_start date,p_end date,p_manager text,p_art text,p_os text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_org_manager(p_org) or not public.can_use_module(p_org,'obras') then raise exception 'Sem permissão'; end if;
 if length(btrim(coalesce(p_name,''))) not between 2 and 120 or p_budget<0 then raise exception 'Dados inválidos'; end if;
 insert into public.projects(organization_id,name,code,budget_cents,created_by) values(p_org,p_name,p_code,p_budget,auth.uid()) returning id into v_id;
 insert into public.project_details(project_id,organization_id,client_name,contract_number,description,location,start_date,end_date,technical_manager,art_number,service_order_number)
 values(v_id,p_org,p_client,p_contract,p_description,p_location,p_start,p_end,p_manager,p_art,p_os);
 return v_id;
end; $$;

-- RESTRIÇÕES: somentes empresas associadas. Escrita de lançamentos operacionais requer assinatura ativa.
-- Cadastro/consulta de colaboradores são segregados por empresa; escritas por admin/owner.
do $$ declare t text; m text; begin
 for t,m in select * from (values
 ('project_details','obras'),('employees','cadastros'),('work_items','obras'),
 ('planning_entries','obras'),('production_entries','obras'),('replanning_entries','obras'),
 ('monthly_targets','obras'),('daily_site_reports','diario-obra'),('employee_transfers','cadastros'),
 ('file_registry','gerencial')) as x(tab,mod) loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy %I on public.%I for select to authenticated using(public.can_use_module(organization_id,%L))',t||'_read',t,m);
 end loop;
end $$;

create policy project_details_write on public.project_details for insert to authenticated with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras'));
create policy project_details_edit on public.project_details for update to authenticated using(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras')) with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras'));
create policy employees_write on public.employees for insert to authenticated with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'cadastros') and created_by=auth.uid());
create policy employees_edit on public.employees for update to authenticated using(public.is_org_manager(organization_id)) with check(public.is_org_manager(organization_id));
create policy work_items_write on public.work_items for insert to authenticated with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras') and created_by=auth.uid());
create policy planning_write on public.planning_entries for insert to authenticated with check(public.can_use_module(organization_id,'obras') and created_by=auth.uid());
create policy production_write on public.production_entries for insert to authenticated with check(public.can_use_module(organization_id,'obras') and created_by=auth.uid());
create policy replanning_write on public.replanning_entries for insert to authenticated with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras') and created_by=auth.uid());
create policy target_write on public.monthly_targets for insert to authenticated with check(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras') and created_by=auth.uid());
create policy target_edit on public.monthly_targets for update to authenticated using(public.is_org_manager(organization_id)) with check(public.is_org_manager(organization_id));
create policy daily_write on public.daily_site_reports for insert to authenticated with check(public.can_use_module(organization_id,'diario-obra') and created_by=auth.uid());
create policy transfer_write on public.employee_transfers for insert to authenticated with check(public.can_use_module(organization_id,'cadastros') and created_by=auth.uid());
create policy file_write on public.file_registry for insert to authenticated with check(public.can_use_module(organization_id,'gerencial') and uploaded_by=auth.uid());

-- Não permitir update direto em status ou valores calculados.
revoke update on public.production_entries,public.employee_transfers,public.planning_entries,public.replanning_entries,public.work_items from authenticated;
revoke update on public.employees from authenticated;
grant update(name,role_title,role_level,status,admission_date,medical_exam_expires_on,rope_access_level,rope_access_expires_on,safety_training_expires_on,notes,current_project_id,updated_at) on public.employees to authenticated;
revoke update on public.monthly_targets from authenticated;
grant update(target_cents,updated_at) on public.monthly_targets to authenticated;

-- Protege campos pessoais, que somente gestores podem consultar; listagem genérica não expõe CPF.
-- OBS: leitura irrestrita de tabela employees por membro é LIMITADA via aplicação; para um produto comercial
-- com RH sensível, adicione uma VIEW específica para públicos e restrinja grants de CPF/ASO.
-- Por padrão, o CPF NÃO é disponibilizado a membros comuns via SELECT.
revoke select on public.employees from authenticated;
grant select(id,organization_id,employee_number,name,role_title,role_level,admission_date,current_project_id,status,created_at,updated_at) on public.employees to authenticated;
-- Campos médicos/CPF exigem RPC autorizada para gestores; não usar select('*') no frontend.
create function public.get_employee_sensitive(p_employee_id uuid)
returns table(cpf text,birth_date date,medical_exam_expires_on date,rope_access_level text,rope_access_expires_on date,safety_training_expires_on date,notes text)
language sql stable security definer set search_path='' as $$
 select e.cpf,e.birth_date,e.medical_exam_expires_on,e.rope_access_level,e.rope_access_expires_on,e.safety_training_expires_on,e.notes
 from public.employees e where e.id=p_employee_id and public.is_org_manager(e.organization_id);
$$;

revoke all on function public.decide_production(uuid,boolean,text), public.decide_transfer(uuid,boolean), public.register_project(uuid,text,text,bigint,text,text,text,text,date,date,text,text,text), public.get_employee_sensitive(uuid) from public,anon;
grant execute on function public.decide_production(uuid,boolean,text), public.decide_transfer(uuid,boolean), public.register_project(uuid,text,text,bigint,text,text,text,text,date,date,text,text,text), public.get_employee_sensitive(uuid) to authenticated;

-- Os novos módulos também podem ser ativados em empresas de teste conforme plano vigente.
insert into public.plan_modules(plan_id,module_slug) values ('trial','obras'),('trial','cadastros'),('trial','diario-obra') on conflict do nothing;

-- Upsert de metas via transação controlada: não permite trocar autor/tenant por meio da API.
create function public.set_monthly_target(p_org uuid,p_project uuid,p_month date,p_cents bigint)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_org_manager(p_org) or not public.can_use_module(p_org,'obras') then raise exception 'Sem permissão'; end if;
 if p_month is null or extract(day from p_month)<>1 or p_cents is null or p_cents<0 then raise exception 'Meta inválida'; end if;
 if not exists(select 1 from public.projects where id=p_project and organization_id=p_org) then raise exception 'Obra inválida'; end if;
 insert into public.monthly_targets(organization_id,project_id,month,target_cents,created_by)
 values(p_org,p_project,p_month,p_cents,auth.uid())
 on conflict (organization_id,project_id,month) do update set target_cents=excluded.target_cents,updated_at=now()
 returning id into v_id;
 insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data)
 values(p_org,auth.uid(),'DEFINIR_META','monthly_targets',v_id,jsonb_build_object('competencia',p_month,'valor_centavos',p_cents));
 return v_id;
end; $$;
revoke all on function public.set_monthly_target(uuid,uuid,date,bigint) from public,anon;
grant execute on function public.set_monthly_target(uuid,uuid,date,bigint) to authenticated;
