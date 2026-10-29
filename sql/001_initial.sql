-- Visto ERP | Migração inicial (executar em um projeto Supabase NOVO)
-- Multiempresa com RLS, trial, módulos, convites com token SHA-256, log de auditoria.
-- Não rode em um banco existente sem revisar conflitos e gerar backup.
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  document text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','disabled')),
  joined_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);

create table public.module_catalog (
  slug text primary key,
  title text not null,
  description text not null,
  sort_order integer not null default 0
);

create table public.plans (
  id text primary key,
  name text not null,
  max_users int not null check (max_users >= 1),
  price_monthly_cents integer check (price_monthly_cents >= 0)
);

create table public.plan_modules (
  plan_id text not null references public.plans(id) on delete cascade,
  module_slug text not null references public.module_catalog(slug) on delete cascade,
  primary key(plan_id,module_slug)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('trialing','active','past_due','canceled')),
  current_period_end timestamptz not null,
  external_provider text,
  external_subscription_id text,
  created_at timestamptz not null default now()
);
create index subscriptions_org_idx on public.subscriptions(organization_id,status,current_period_end desc);

create table public.organization_modules (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_slug text not null references public.module_catalog(slug),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(organization_id,module_slug)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  role text not null check (role in ('admin','member')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index invitations_org_idx on public.invitations(organization_id,created_at desc);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check(char_length(btrim(name)) between 2 and 120),
  code text,
  status text not null default 'planejada' check(status in ('planejada','em_andamento','concluida','suspensa')),
  budget_cents bigint check (budget_cents is null or budget_cents >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_org_idx on public.projects(organization_id,created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs(organization_id,created_at desc);

insert into public.module_catalog(slug,title,description,sort_order) values
  ('obras','Gestão de Obras','Obras, orçamento, indicadores e planejamento.',10),
  ('financeiro','Financeiro','Contas, fluxo de caixa e centros de custo (em desenvolvimento).',20),
  ('qsms','QSMS e SST','Inspeções e não conformidades (em desenvolvimento).',30),
  ('compras','Compras','Solicitações, cotações e pedidos (em desenvolvimento).',40),
  ('rh','Recursos Humanos','Pessoas, treinamentos e documentos (em desenvolvimento).',50),
  ('ambiental','Meio Ambiente','Licenças e condicionantes (em desenvolvimento).',60);

insert into public.plans(id,name,max_users,price_monthly_cents) values
  ('trial','Avaliação (14 dias)',5,null),
  ('essencial','Essencial (preço a definir)',10,null),
  ('profissional','Profissional (preço a definir)',30,null);

insert into public.plan_modules(plan_id,module_slug)
select 'trial',slug from public.module_catalog;
insert into public.plan_modules(plan_id,module_slug) values
  ('essencial','obras'),('essencial','financeiro'),
  ('profissional','obras'),('profissional','financeiro'),('profissional','qsms'),('profissional','compras'),('profissional','rh'),('profissional','ambiental');

-- Helpers SEC DEFINER evitam recursão nas políticas de organization_members.
create function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id = p_org_id and m.user_id = (select auth.uid()) and m.status='active'
  );
$$;
create function public.is_org_manager(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id=p_org_id and m.user_id=(select auth.uid())
    and m.status='active' and m.role in ('owner','admin')
  );
$$;

create function public.is_org_owner(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members m
    where m.organization_id=p_org_id and m.user_id=(select auth.uid())
    and m.status='active' and m.role='owner');
$$;

create function public.has_active_subscription(p_org_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.subscriptions s
    where s.organization_id=p_org_id and s.status in ('trialing','active')
      and s.current_period_end > now());
$$;

create function public.can_use_module(p_org_id uuid,p_module text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_org_member(p_org_id)
  and exists (
    select 1 from public.organization_modules om
    join public.subscriptions s on s.organization_id=om.organization_id
    join public.plan_modules pm on pm.plan_id=s.plan_id and pm.module_slug=om.module_slug
    where om.organization_id=p_org_id and om.module_slug=p_module and om.enabled
      and s.status in ('trialing','active') and s.current_period_end>now()
  );
$$;

-- Perfis de usuários registrados.
create function public.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id,full_name)
  values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120))
  on conflict(user_id) do nothing;
  return new;
end;
$$;
create trigger after_auth_signup after insert on auth.users
for each row execute function public.on_auth_user_created();

-- Criação atômica de empresa; apenas sessão autenticada com email verificado.
create function public.create_organization(p_name text,p_document text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_email_verified timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'Acesso não autenticado'; end if;
  select email_confirmed_at into v_email_verified from auth.users where id=(select auth.uid());
  if v_email_verified is null then raise exception 'Confirme seu email antes de cadastrar a empresa'; end if;
  if char_length(btrim(coalesce(p_name,''))) not between 2 and 120 then raise exception 'Nome inválido'; end if;
  insert into public.organizations(name,document,created_by)
    values(btrim(p_name),nullif(btrim(coalesce(p_document,'')),''),(select auth.uid()))
    returning id into v_org;
  insert into public.organization_members(organization_id,user_id,role)
    values(v_org,(select auth.uid()),'owner');
  insert into public.subscriptions(organization_id,plan_id,status,current_period_end)
    values(v_org,'trial','trialing',now()+interval '14 days');
  insert into public.organization_modules(organization_id,module_slug,enabled)
    select v_org,slug,(slug='obras') from public.module_catalog;
  return v_org;
end;
$$;

-- Aceitação segura de convite: token de uso único e email confirmado correspondente.
create function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_inv public.invitations%rowtype; v_email text; v_confirmed timestamptz;
        v_seat_limit int; v_current_users int;
begin
  if (select auth.uid()) is null then raise exception 'Faça login antes de aceitar o convite'; end if;
  if char_length(p_token) < 32 or char_length(p_token) > 256 then raise exception 'Convite inválido'; end if;
  select email,email_confirmed_at into v_email,v_confirmed
    from auth.users where id=(select auth.uid());
  if v_confirmed is null then raise exception 'Confirme seu email'; end if;
  select * into v_inv from public.invitations
    where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') for update;
  if not found or v_inv.used_at is not null or v_inv.expires_at <= now()
    then raise exception 'Convite inválido ou expirado'; end if;
  if lower(v_inv.email) <> lower(v_email) then
    raise exception 'Faça login com o email para o qual o convite foi emitido';
  end if;
  if not public.has_active_subscription(v_inv.organization_id)
    then raise exception 'A organização não possui assinatura vigente'; end if;
  if exists(select 1 from public.organization_members
    where organization_id=v_inv.organization_id and user_id=(select auth.uid())) then
    raise exception 'Este usuário já pertence à empresa';
  end if;
  -- Bloqueio serializado por organização para impedir exceder assentos com convites concorrentes.
  perform 1 from public.organizations where id=v_inv.organization_id for update;
  select p.max_users into v_seat_limit
    from public.subscriptions s join public.plans p on p.id=s.plan_id
    where s.organization_id=v_inv.organization_id and s.status in ('trialing','active')
      and s.current_period_end>now() order by s.current_period_end desc limit 1;
  select count(*) into v_current_users from public.organization_members
    where organization_id=v_inv.organization_id and status='active';
  if v_current_users>=v_seat_limit then raise exception 'Limite de usuários atingido'; end if;
  insert into public.organization_members(organization_id,user_id,role)
    values(v_inv.organization_id,(select auth.uid()),v_inv.role);
  update public.invitations set used_at=now() where id=v_inv.id;
  return v_inv.organization_id;
end;
$$;

create function public.toggle_org_module(p_org_id uuid,p_module text,p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_org_manager(p_org_id) then raise exception 'Sem permissão'; end if;
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

-- Auditoria de alterações das obras, gerada pelo banco (não pelo navegador).
create function public.audit_project_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_id uuid;
begin
  v_org:=coalesce(new.organization_id,old.organization_id);
  v_id:=coalesce(new.id,old.id);
  insert into public.audit_logs(organization_id,actor_id,action,entity,entity_id,event_data)
    values(v_org,(select auth.uid()),TG_OP,'projects',v_id,
      jsonb_build_object('name',coalesce(new.name,old.name),'status',coalesce(new.status,old.status)));
  return coalesce(new,old);
end;
$$;
create trigger after_projects_changed after insert or update or delete on public.projects
for each row execute function public.audit_project_change();

-- RLS em todas as tabelas com dados de clientes.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.module_catalog enable row level security;
alter table public.plans enable row level security;
alter table public.plan_modules enable row level security;
alter table public.subscriptions enable row level security;
alter table public.organization_modules enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.audit_logs enable row level security;

create policy profile_own_read on public.profiles for select to authenticated using(user_id=(select auth.uid()));
create policy profile_shared_org_read on public.profiles for select to authenticated using(
  exists(select 1 from public.organization_members m
    where m.user_id=profiles.user_id and public.is_org_member(m.organization_id))
);
create policy profile_self_update on public.profiles for update to authenticated
  using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy organizations_select on public.organizations for select to authenticated
  using(public.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using(public.is_org_manager(id)) with check(public.is_org_manager(id));
create policy members_select on public.organization_members for select to authenticated
  using(public.is_org_member(organization_id));
create policy catalog_select on public.module_catalog for select to authenticated using(true);
create policy plans_select on public.plans for select to authenticated using(true);
create policy plan_modules_select on public.plan_modules for select to authenticated using(true);
create policy subscription_read on public.subscriptions for select to authenticated
  using(public.is_org_manager(organization_id));
create policy org_modules_read on public.organization_modules for select to authenticated
  using(public.is_org_member(organization_id));
create policy invites_read on public.invitations for select to authenticated
  using(public.is_org_manager(organization_id));
create policy invites_insert on public.invitations for insert to authenticated
  with check(public.is_org_manager(organization_id)
    and created_by=(select auth.uid()) and role in ('admin','member')
    and used_at is null and expires_at>now() and expires_at<=now()+interval '8 days');
create policy projects_read on public.projects for select to authenticated
  using(public.can_use_module(organization_id,'obras'));
create policy projects_insert on public.projects for insert to authenticated
  with check(public.can_use_module(organization_id,'obras') and created_by=(select auth.uid()));
create policy projects_update on public.projects for update to authenticated
  using(public.can_use_module(organization_id,'obras'))
  with check(public.can_use_module(organization_id,'obras'));
create policy projects_delete on public.projects for delete to authenticated
  using(public.is_org_manager(organization_id) and public.can_use_module(organization_id,'obras'));
create policy audit_select on public.audit_logs for select to authenticated
  using(public.is_org_manager(organization_id));

-- Privilégios mínimos em funções: RPCs apenas com sessão autenticada.
revoke all on function public.create_organization(text,text) from public,anon;
revoke all on function public.accept_invitation(text) from public,anon;
revoke all on function public.toggle_org_module(uuid,text,boolean) from public,anon;
revoke all on function public.is_org_member(uuid) from public,anon;
revoke all on function public.is_org_manager(uuid) from public,anon;
revoke all on function public.is_org_owner(uuid) from public,anon;
revoke all on function public.has_active_subscription(uuid) from public,anon;
revoke all on function public.can_use_module(uuid,text) from public,anon;
grant execute on function public.create_organization(text,text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.toggle_org_module(uuid,text,boolean) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_manager(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;
grant execute on function public.has_active_subscription(uuid) to authenticated;
grant execute on function public.can_use_module(uuid,text) to authenticated;

-- Não há INSERT/UPDATE direto de subscriptions ou memberships pelo cliente.
-- Assinaturas pagas devem ser ativadas SOMENTE por webhook de cobrança validado.

-- Restringe alterações de colunas sensíveis mesmo para usuários que possuam UPDATE via RLS.
revoke update on public.organizations from authenticated;
grant update(name,document) on public.organizations to authenticated;
revoke update on public.profiles from authenticated;
grant update(full_name) on public.profiles to authenticated;
revoke update on public.projects from authenticated;
grant update(name,code,status,budget_cents,updated_at) on public.projects to authenticated;
