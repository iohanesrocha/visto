'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {getItem} from '@/lib/navigation';
import {requireOrganization} from '@/lib/tenant';
const createSchema=z.object({organizationId:z.uuid(),module:z.string().min(2).max(40),screen:z.string().min(2).max(60),
  title:z.string().trim().min(2).max(160),reference:z.string().trim().max(60),
  amount:z.string().trim().max(18),occurred_on:z.string().max(10),description:z.string().trim().max(2000)});
function route(org:string,module:string,screen:string){return `/erp/${org}/operacional/${module}/${screen}`;}
function getValidPage(org:string,module:string,screen:string){
  const entry=getItem(module,screen);
  if (!entry||entry.item.shortcut) redirect(`/erp/${org}`);
  return entry;
}
function centsFromInput(value:string):number|null{
  if(!value) return null;
  if(!/^\d{1,12}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole,decimal='']=value.split('.');
  const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  return Number.isSafeInteger(cents)?cents:null;
}
export async function createModuleRecord(formData:FormData){
  const parsed=createSchema.safeParse(Object.fromEntries([...formData.entries()].map(([k,v])=>[k,typeof v==='string'?v:''])));
  if(!parsed.success) redirect('/erp');
  const {organizationId,module,screen,title,reference,amount,occurred_on,description}=parsed.data;
  getValidPage(organizationId,module,screen);
  const back=route(organizationId,module,screen);
  if(amount&&centsFromInput(amount)===null)redirect(`${back}?erro=valor`);
  if(occurred_on&&!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on))redirect(`${back}?erro=data`);
  const {supabase,user}=await requireOrganization(organizationId);
  const {error}=await supabase.from('module_records').insert({organization_id:organizationId,module_slug:module,screen_slug:screen,title,
    reference:reference||null,amount_cents:centsFromInput(amount),occurred_on:occurred_on||null,description:description||null,created_by:user.id});
  if(error) redirect(`${back}?erro=salvar`);
  revalidatePath(back);
  redirect(`${back}?sucesso=1`);
}
export async function changeModuleRecordStatus(formData:FormData){
  const parsed=z.object({organizationId:z.uuid(),module:z.string().max(40),screen:z.string().max(60),recordId:z.uuid(),
    status:z.enum(['rascunho','em_analise','concluido','cancelado'])}).safeParse(Object.fromEntries(formData));
  if(!parsed.success)redirect('/erp');
  const {organizationId,module,screen,recordId,status}=parsed.data;
  getValidPage(organizationId,module,screen);
  const back=route(organizationId,module,screen);
  const {supabase}=await requireOrganization(organizationId);
  const {error}=await supabase.from('module_records').update({status,updated_at:new Date().toISOString()})
    .eq('id',recordId).eq('organization_id',organizationId).eq('module_slug',module).eq('screen_slug',screen);
  if(error)redirect(`${back}?erro=atualizar`);
  revalidatePath(back);
  redirect(back);
}
