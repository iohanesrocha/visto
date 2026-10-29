-- Visto ERP | 002 | Expansão do catálogo e registros genéricos para implantação
-- Rode APÓS 001_initial.sql. Não equivale à implantação de módulos fiscais/contábeis oficiais.
-- Faça backup se aplicar a ambientes já usados.
insert into public.module_catalog(slug,title,description,sort_order) values
 ('gerencial','Gerencial','Painéis, aprovações e GED (cadastros preliminares).',1),
 ('administracao','Administração','Empresas, equipe, módulos e auditoria.',2),
 ('cadastros','Cadastros','Cadastros mestres iniciais de negócio.',3),
 ('financeiro','Financeiro','Registros financeiros básicos para homologação.',20),
 ('suprimentos','Suprimentos','Solicitações, cotações, pedidos e estoque (registros básicos).',30),
 ('fiscal','Fiscal','Registros fiscais preliminares; sem emissão/transmissão.',40),
 ('patrimonio','Patrimônio','Registros de bens e inventário.',50),
 ('frota','Frota','Veículos, abastecimentos e manutenções.',60),
 ('diario-obra','Diário de Obra','Diário, produção e ocorrências preliminares.',70),
 ('alojamentos','Alojamentos','Unidades e ocupações preliminares.',80),
 ('contabilidade','Contabilidade','Registros não oficiais; sem escrituração.',90),
 ('qsms','QSMS / SST','Inspeções, não conformidades e treinamentos preliminares.',100)
on conflict(slug) do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

-- Todos os grupos ficam disponíveis na avaliação; cobrança real ainda está pendente.
insert into public.plan_modules(plan_id,module_slug)
 select 'trial',slug from public.module_catalog on conflict do nothing;
insert into public.plan_modules(plan_id,module_slug)
 select p.id, m.slug from public.plans p cross join public.module_catalog m
 where p.id in ('essencial','profissional') and m.slug in ('gerencial','administracao','cadastros')
 on conflict do nothing;
insert into public.plan_modules(plan_id,module_slug)
 select 'profissional',slug from public.module_catalog on conflict do nothing;

-- Novos módulos nas empresas já criadas, habilitados para o trial.
insert into public.organization_modules(organization_id,module_slug,enabled)
 select o.id,m.slug,
  (m.slug in ('gerencial','administracao','cadastros') or exists (
    select 1 from public.subscriptions s
    where s.organization_id=o.id and s.plan_id='trial' and s.status='trialing' and s.current_period_end>now()
  ))
 from public.organizations o cross join public.module_catalog m
 on conflict(organization_id,module_slug) do nothing;

-- Ajuste da criação de novas empresas com todos os módulos de teste habilitados.
create or replace function public.create_organization(p_name text,p_document text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_email_verified timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'Acesso não autenticado'; end if;
  select email_confirmed_at into v_email_verified from auth.users where id=(select auth.uid());
  if v_email_verified is null then raise exception 'Confirme seu email antes de cadastrar a empresa'; end if;
  if char_length(btrim(coalesce(p_name,''))) not between 2 and 120 then raise exception 'Nome inválido'; end if;
  insert into public.organizations(name,document,created_by)
    values(btrim(p_name),nullif(btrim(coalesce(p_document,'')),''),(select auth.uid())) returning id into v_org;
  insert into public.organization_members(organization_id,user_id,role)
    values(v_org,(select auth.uid()),'owner');
  insert into public.subscriptions(organization_id,plan_id,status,current_period_end)
    values(v_org,'trial','trialing',now()+interval '14 days');
  insert into public.organization_modules(organization_id,module_slug,enabled)
    select v_org,slug,true from public.module_catalog;
  return v_org;
end;
$$;

create table public.module_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_slug text not null references public.module_catalog(slug),
  screen_slug text not null check(length(screen_slug) between 2 and 60),
  title text not null check(length(btrim(title)) between 2 and 160),
  reference text check(reference is null or length(reference)<=60),
  description text check(description is null or length(description)<=2000),
  amount_cents bigint check(amount_cents is null or amount_cents>=0),
  occurred_on date,
  status text not null default 'rascunho' check(status in ('rascunho','em_analise','concluido','cancelado')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index module_records_org_query_idx on public.module_records(organization_id,module_slug,screen_slug,created_at desc);
alter table public.module_records enable row level security;
create policy module_records_read on public.module_records for select to authenticated
 using(public.can_use_module(organization_id,module_slug));
create policy module_records_insert on public.module_records for insert to authenticated
 with check(public.can_use_module(organization_id,module_slug) and created_by=(select auth.uid()));
create policy module_records_update on public.module_records for update to authenticated
 using(public.can_use_module(organization_id,module_slug))
 with check(public.can_use_module(organization_id,module_slug));
create policy module_records_delete on public.module_records for delete to authenticated
 using(public.is_org_manager(organization_id) and public.can_use_module(organization_id,module_slug));

-- Evita que a atualização mude o tenant, módulo ou criador.
revoke update on public.module_records from authenticated;
grant update(status,updated_at) on public.module_records to authenticated;

-- Registro de auditoria gerado no banco, não pelo navegador.
create function public.audit_module_record() returns trigger
 language plpgsql security definer set search_path = '' as $$
 declare v_org uuid;v_id uuid;
 begin
   v_org=coalesce(new.organization_id,old.organization_id);
   v_id=coalesce(new.id,old.id);
   insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data)
   values(v_org,(select auth.uid()),TG_OP,'module_records',v_id,
    jsonb_build_object('module',coalesce(new.module_slug,old.module_slug),
                       'screen',coalesce(new.screen_slug,old.screen_slug),
                       'status',coalesce(new.status,old.status)));
   return coalesce(new,old);
 end;
$$;
create trigger audit_module_records after insert or update or delete on public.module_records
  for each row execute function public.audit_module_record();

-- Módulos básicos não podem ser desabilitados para impedir perda de acesso administrativo.
create or replace function public.toggle_org_module(p_org_id uuid,p_module text,p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_org_manager(p_org_id) then raise exception 'Sem permissão'; end if;
  if p_module in ('gerencial','administracao','cadastros') and not p_enabled
    then raise exception 'O módulo principal não pode ser desativado'; end if;
  if p_enabled and not exists (
    select 1 from public.subscriptions s
      join public.plan_modules pm on pm.plan_id=s.plan_id and pm.module_slug=p_module
    where s.organization_id=p_org_id and s.status in ('trialing','active')
      and s.current_period_end>now()
  ) then raise exception 'Módulo não incluído no plano vigente'; end if;
  update public.organization_modules set enabled=p_enabled,updated_at=now()
    where organization_id=p_org_id and module_slug=p_module;
  if not found then raise exception 'Módulo inexistente'; end if;
end;
$$;
revoke all on function public.toggle_org_module(uuid,text,boolean) from public,anon;
grant execute on function public.toggle_org_module(uuid,text,boolean) to authenticated;

-- Grants explícitos para funcionamento em novas instalações com privilégios restritivos.
revoke all on public.module_records from anon;
grant select,insert,delete on public.module_records to authenticated;
grant update(status,updated_at) on public.module_records to authenticated;
