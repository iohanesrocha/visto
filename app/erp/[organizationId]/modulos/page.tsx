import {Boxes,CheckCircle2,LockKeyhole} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
import {toggleModule} from '@/app/erp/actions';

export default async function Modules({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{erro?:string}>}){
  const {organizationId}=await params;
  const {supabase,role}=await requireOrganization(organizationId);
  const [{data:catalog},{data:enabled},{data:subs},{data:planModules}]=await Promise.all([
    supabase.from('module_catalog').select('*').order('sort_order'),
    supabase.from('organization_modules').select('module_slug,enabled').eq('organization_id',organizationId),
    supabase.from('subscriptions').select('plan_id,status,current_period_end').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(1),
    supabase.from('plan_modules').select('plan_id,module_slug')
  ]);
  const sub=subs?.[0];const isValid=!!sub&&['trialing','active'].includes(sub.status)&&new Date(sub.current_period_end)>new Date();
  const included = new Set(planModules?.filter(m=>m.plan_id===sub?.plan_id).map(m=>m.module_slug));
  const active = new Set(enabled?.filter(e=>e.enabled).map(e=>e.module_slug));
  return <><div className="eyebrow">CONFIGURAÇÕES DA EMPRESA</div><h1 className="page-title">Módulos do ERP</h1><p className="muted small">Ative os módulos permitidos no plano da empresa. Os módulos oferecem telas padronizadas e registros iniciais; os processos específicos de cada área ainda exigem implementação.</p>
    {(await searchParams).erro&&<p className="note note-error">Operação não permitida ou seu plano não inclui este módulo.</p>}
    <div className="panel panel-pad space-top"><div className="list-row" style={{paddingTop:0}}><div><b>Catálogo de módulos</b><p className="small muted">{catalog?.length??0} módulos planejados no sistema</p></div><span className="pill">Plano: {sub?.plan_id??'Não configurado'}</span></div>
      {catalog?.map(m=>{
        const on=active.has(m.slug);const eligible=isValid&&included.has(m.slug);
        const ready=m.slug==='obras';
        const core=['gerencial','administracao','cadastros'].includes(m.slug);
        return <div className="list-row" key={m.slug}><div className="list-left"><div className="module-icon"><Boxes size={18}/></div><div><strong>{m.title}</strong><p>{m.description}</p><div style={{marginTop:7,display:'flex',gap:5,flexWrap:'wrap'}}><span className={`pill ${ready?'tag-green':'tag-orange'}`}>{ready?'Cadastro de obras':'Registros básicos'}</span><span className="pill">{on?'Ativado':'Desativado'}</span></div></div></div>
          {canManage(role)?<form action={toggleModule}><input type="hidden" name="orgId" value={organizationId}/><input type="hidden" name="slug" value={m.slug}/><input type="hidden" name="enabled" value={String(!on)}/><button type="submit" className={on?'btn btn-ghost':'btn btn-secondary'} disabled={!eligible||core} style={{fontSize:12,padding:'9px 12px',whiteSpace:'nowrap'}}>{!eligible?<><LockKeyhole size={13}/>Bloqueado</>:core?'Fixo':on?'Desativar':<><CheckCircle2 size={13}/>Ativar</>}</button></form>:null}</div>;
      })}
    </div><p className="footer-note">A seleção de módulos na avaliação é demonstrativa. Produtos pagos dependem da implementação do faturamento e da liberação contratual pelo administrador da plataforma.</p>
  </>;
}
