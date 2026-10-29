import {requireOrganization} from '@/lib/tenant';
import {AppShell} from '@/components/shell/app-shell';
export default async function OrganizationLayout({children,params}:{children:React.ReactNode;params:Promise<{organizationId:string}>}) {
  const {organizationId}=await params;
  const {organization,role,user,supabase}=await requireOrganization(organizationId);
  const [{data:enabled},{data:profile},{data:isPlatformAdmin}]=await Promise.all([
    supabase.from('organization_modules').select('module_slug').eq('organization_id',organizationId).eq('enabled',true),
    supabase.from('profiles').select('full_name').eq('user_id',user.id).maybeSingle(),
    supabase.rpc('is_platform_admin')
  ]);
  return <AppShell organizationId={organizationId} organizationName={organization.name} email={user.email||''} fullName={profile?.full_name||''} role={role} isPlatformAdmin={!!isPlatformAdmin} enabledModules={(enabled||[]).map(m=>m.module_slug)}>{children}</AppShell>;
}
