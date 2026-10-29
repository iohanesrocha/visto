'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {getForm} from '@/lib/forms/catalog';
import {requireOrganization,canManage} from '@/lib/tenant';
const path=(org:string,code:string)=>`/erp/${org}/formularios/${encodeURIComponent(code)}`;
const id=z.string().uuid();
const clean=(f:FormData,k:string)=>String(f.get(k)||'').trim();
const decimal=(v:string,defaultValue=0)=>{if(!v)return defaultValue; if(!/^\d{1,12}(?:\.\d{1,5})?$/.test(v))throw Error('Número inválido');const n=Number(v);if(!Number.isFinite(n))throw Error('Número inválido');return n;};
const cents=(v:string)=>{if(!/^\d{1,12}(?:\.\d{1,2})?$/.test(v||'0'))throw Error('Valor inválido');return Math.round(Number(v||'0')*100);};
const asId=(v:string)=>v?id.parse(v):null;
export async function submitVistoForm(form:FormData){
  const org=id.safeParse(clean(form,'organizationId'));
  const spec=getForm(clean(form,'code'));
  if(!org.success||!spec||spec.readOnly)redirect('/erp');
  const back=path(org.data,spec.code);
  const {supabase,user,role}=await requireOrganization(org.data);
  if(spec.managerOnly&&!canManage(role))redirect(`${back}?erro=permissao`);
  const {data:allowed}=await supabase.rpc('can_use_module',{p_org_id:org.data,p_module:spec.module});
  if(!allowed)redirect(`${back}?erro=licenca`);
  const values:Record<string,unknown>={organization_id:org.data,created_by:user.id};
  try {
    for (const field of spec.fields) {
      const v=clean(form,field.name);
      if(field.required&&!v)throw Error('Campo obrigatório');
      if(v.length>2000)throw Error('Campo longo');
      if(field.type==='checkbox')values[field.name]=form.has(field.name);
      else if(field.type==='project'||field.type==='employee'||field.type==='work_item')values[field.name]=asId(v);
      else if(field.type==='number')values[field.name]=decimal(v);
      else if(field.type==='money')values[field.name]=cents(v);
      else if(field.type==='date')values[field.name]=v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
      else values[field.name]=v||null;
    }
    if(spec.code==='ADM-010'){
      const {error}=await supabase.rpc('register_project',{
        p_org:org.data,p_name:values.name,p_code:values.code,p_budget:values.budget??0,
        p_client:values.client_name,p_contract:values.contract_number,p_description:values.description,
        p_location:values.location,p_start:values.start_date,p_end:values.end_date,
        p_manager:values.technical_manager,p_art:values.art_number,p_os:values.service_order_number
      });
      if(error)throw error;
    }else{
      if(spec.code==='OBR-000'){values.unit_price_cents=values.unit_price;delete values.unit_price;}
      if(spec.code==='OBR-005'){
        values.target_cents=values.target_amount;delete values.target_amount;
        const {error}=await supabase.rpc('set_monthly_target',{p_org:org.data,p_project:values.project_id,p_month:values.month,p_cents:values.target_cents});
        if(error)throw error;
      }else{
        const {error}=await supabase.from(spec.table).insert(values as never);
        if(error)throw error;
      }
    }
  }catch(error){console.error('Falha ao salvar formulário',spec.code,error instanceof Error?error.message:'erro');redirect(`${back}?erro=salvar`);}
  revalidatePath(back);
  revalidatePath(`/erp/${org.data}`);
  redirect(`${back}?sucesso=1`);
}
export async function decideVistoRecord(form:FormData){
  const org=id.safeParse(clean(form,'organizationId'));const record=id.safeParse(clean(form,'recordId'));
  const kind=clean(form,'kind');const action=clean(form,'decision');
  if(!org.success||!record.success||!['production','transfer'].includes(kind)||!['approve','reject'].includes(action))redirect('/erp');
  const {supabase,role}=await requireOrganization(org.data);
  if(!canManage(role))redirect(`/erp/${org.data}`);
  const fn=kind==='production'?'decide_production':'decide_transfer';
  const {error}=kind==='production'? await supabase.rpc(fn as 'decide_production',{p_id:record.data,p_approved:action==='approve',p_reason:clean(form,'reason')}) : await supabase.rpc('decide_transfer',{p_id:record.data,p_approved:action==='approve'});
  const code=kind==='production'?'OBR-002':'ADM-004';const back=path(org.data,code);
  if(error)redirect(`${back}?erro=decisao`);
  revalidatePath(back);redirect(`${back}?sucesso=decisao`);
}
