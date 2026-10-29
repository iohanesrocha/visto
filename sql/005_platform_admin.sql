-- Visto ERP | 005 | Visão administrativa do operador da plataforma
-- Criar acesso SOMENTE após signup do administrador, com e-mail confirmado.
create table public.platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- Nenhuma política de INSERT/UPDATE/DELETE via app.
create policy platform_admin_self on public.platform_admins for select to authenticated using(user_id=auth.uid());

create function public.is_platform_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_admins p where p.user_id=auth.uid());
$$;
create function public.platform_overview()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_platform_admin() then raise exception 'Acesso restrito ao operador'; end if;
 select jsonb_build_object(
   'organizations',(select count(*) from public.organizations),
   'users',(select count(distinct user_id) from public.organization_members where status='active'),
   'trials',(select count(*) from public.subscriptions where status='trialing' and current_period_end>now()),
   'active_subscriptions',(select count(*) from public.subscriptions where status='active' and current_period_end>now()),
   'organizations_list',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'created_at',o.created_at,
        'members',(select count(*) from public.organization_members m where m.organization_id=o.id),
        'status',(select s.status from public.subscriptions s where s.organization_id=o.id order by s.created_at desc limit 1)) order by o.created_at desc),'[]'::jsonb)
     from (select id,name,created_at from public.organizations order by created_at desc limit 100) o)
 ) into result;
 return result;
end; $$;
revoke all on public.platform_admins from anon;
revoke all on function public.is_platform_admin(),public.platform_overview() from public,anon;
grant execute on function public.is_platform_admin(),public.platform_overview() to authenticated;

-- ATIVAÇÃO EXPLÍCITA PELO PROPRIETÁRIO NO SQL EDITOR DE PRODUÇÃO, APÓS CONFIRMAÇÃO:
-- insert into public.platform_admins(user_id)
-- select id from auth.users where lower(email)='iohanesd@gmail.com' and email_confirmed_at is not null
-- on conflict do nothing;
-- Não transforme e-mail sem autenticação em privilégio no código do cliente.
