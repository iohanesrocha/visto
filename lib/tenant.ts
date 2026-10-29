import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'owner' | 'admin' | 'member';

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/entrar');
  return { supabase, user };
}

export async function requireOrganization(organizationId: string) {
  const { supabase, user } = await requireUser();
  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('role, organizations(id,name,document)')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !membership || !membership.organizations) notFound();
  const org = membership.organizations as unknown as { id:string; name:string; document:string|null };
  return { supabase, user, organization: org, role: membership.role as Role };
}

export function canManage(role: Role) { return role === 'owner' || role === 'admin'; }
