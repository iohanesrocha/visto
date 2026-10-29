'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOrganization,canManage } from '@/lib/tenant';

export async function addProject(formData:FormData) {
  const parsed = z.object({
    orgId:z.uuid(),name:z.string().trim().min(2).max(120),
    code:z.string().max(30), budget:z.string().max(20)
  }).safeParse({orgId:formData.get('orgId'),name:formData.get('name'),
    code:formData.get('code')||'',budget:formData.get('budget')||''});
  if (!parsed.success) redirect('/erp?erro=dados');
  const {supabase,user} = await requireOrganization(parsed.data.orgId);
  // O backend valida novamente as regras de licença e isolamento via RLS.
  const budget = parsed.data.budget.trim();
  if (budget && !/^\d{1,12}(?:[.,]\d{1,2})?$/.test(budget))
    redirect(`/erp/${parsed.data.orgId}/obras?erro=orcamento`);
  const [whole,fraction=''] = budget.replace(',','.').split('.');
  const cents = budget === '' ? null : Number(whole)*100 + Number(fraction.padEnd(2,'0'));
  if (cents !== null && (!Number.isSafeInteger(cents)||cents<0))
    redirect(`/erp/${parsed.data.orgId}/obras?erro=orcamento`);
  const {error} = await supabase.from('projects').insert({
    organization_id:parsed.data.orgId,
    name:parsed.data.name,code:parsed.data.code||null,
    budget_cents:cents,created_by:user.id
  });
  if (error) redirect(`/erp/${parsed.data.orgId}/obras?erro=salvar`);
  revalidatePath(`/erp/${parsed.data.orgId}/obras`);
  redirect(`/erp/${parsed.data.orgId}/obras?sucesso=1`);
}

export async function updateProjectStatus(formData:FormData) {
  const parsed = z.object({orgId:z.uuid(),projectId:z.uuid(),status:z.enum(['planejada','em_andamento','concluida','suspensa'])})
    .safeParse({orgId:formData.get('orgId'),projectId:formData.get('projectId'),status:formData.get('status')});
  if(!parsed.success) redirect('/erp');
  const {supabase} = await requireOrganization(parsed.data.orgId);
  const {error} = await supabase.from('projects')
    .update({status:parsed.data.status,updated_at:new Date().toISOString()})
    .eq('organization_id',parsed.data.orgId).eq('id',parsed.data.projectId);
  if(error) redirect(`/erp/${parsed.data.orgId}/obras?erro=salvar`);
  revalidatePath(`/erp/${parsed.data.orgId}/obras`);
  redirect(`/erp/${parsed.data.orgId}/obras`);
}

export async function toggleModule(formData:FormData) {
  const parsed = z.object({orgId:z.uuid(),slug:z.string().min(2).max(40),enabled:z.enum(['true','false'])})
    .safeParse({orgId:formData.get('orgId'),slug:formData.get('slug'),enabled:formData.get('enabled')});
  if (!parsed.success) redirect('/erp');
  const {supabase,role} = await requireOrganization(parsed.data.orgId);
  if(!canManage(role)) redirect(`/erp/${parsed.data.orgId}/modulos?erro=permissao`);
  const {error} = await supabase.rpc('toggle_org_module',{
    p_org_id:parsed.data.orgId,p_module:parsed.data.slug,p_enabled:parsed.data.enabled==='true'
  });
  if(error) redirect(`/erp/${parsed.data.orgId}/modulos?erro=plano`);
  revalidatePath(`/erp/${parsed.data.orgId}`,'layout');
  redirect(`/erp/${parsed.data.orgId}/modulos`);
}
