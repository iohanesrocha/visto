import Link from 'next/link';
import {HardHat,TrendingUp,ClipboardCheck,CalendarRange,Users,ArrowUpRight} from 'lucide-react';
import {requireOrganization} from '@/lib/tenant';
import {money} from '@/lib/format';
import {PageHeading} from '@/components/erp/page-heading';

type Project={id:string;name:string;status:string};
function sumAmount(rows:{amount_cents?:number|null;target_cents?:number|null;revised_amount_cents?:number|null}[],field:'amount_cents'|'target_cents'|'revised_amount_cents'){
  return rows.reduce((acc,r)=>acc+Number(r[field]||0),0);
}
export default async function PainelObras({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{obra?:string}>}){
  const {organizationId}=await params;
  const {obra}=await searchParams;
  const {supabase,organization}=await requireOrganization(organizationId);
  const {data:allowed}=await supabase.rpc('can_use_module',{p_org_id:organizationId,p_module:'obras'});
  if(!allowed)return <p className="note">O módulo Obras não está habilitado para esta assinatura.</p>;
  const {data:projects}=await supabase.from('projects').select('id,name,status').eq('organization_id',organizationId).order('name');
  const all=(projects||[]) as Project[];
  const selected=all.find(p=>p.id===obra);
  const base=selected?{organization_id:organizationId,project_id:selected.id}:{organization_id:organizationId};
  const [plan,prod,replan,targets,people]=await Promise.all([
    supabase.from('planning_entries').select('project_id,work_date,amount_cents,quantity').match(base).limit(20000),
    supabase.from('production_entries').select('project_id,work_date,amount_cents,status,quantity').match(base).eq('status','aprovado').limit(20000),
    supabase.from('replanning_entries').select('project_id,start_date,revised_amount_cents').match(base).limit(20000),
    supabase.from('monthly_targets').select('project_id,month,target_cents').match(base).limit(20000),
    supabase.from('employees').select('id,current_project_id,status').eq('organization_id',organizationId).eq('status','ativo').limit(20000)
  ]);
  const planned=sumAmount(plan.data||[],'amount_cents');const realized=sumAmount(prod.data||[],'amount_cents');
  const replanTotal=sumAmount(replan.data||[],'revised_amount_cents');const goal=sumAmount(targets.data||[],'target_cents');
  const ratio=planned>0?Math.min(100,Math.max(0,Math.round(realized/planned*100))):0;
  const headcount=(people.data||[]).filter(p=>!selected||p.current_project_id===selected.id).length;
  const v=(x:number)=>money(x);
  const cards=[
    {label:'Planejado',value:v(planned),icon:<CalendarRange size={17}/>},
    {label:'Realizado aprovado',value:v(realized),icon:<ClipboardCheck size={17}/>},
    {label:'Replanejamento',value:v(replanTotal),icon:<TrendingUp size={17}/>},
    {label:'Metas registradas',value:v(goal),icon:<TrendingUp size={17}/>},
    {label:'Efetivo ativo',value:String(headcount),icon:<Users size={17}/>},
    {label:'Avanço financeiro',value:`${ratio}%`,icon:<HardHat size={17}/>}
  ];
  return <><PageHeading title="Painel de Obras" eyebrow="GERENCIAL / OBRAS" description={`Visão físico-financeira de ${selected?.name||organization.name}. Realizado considera somente registros aprovados.`}/>
    <form method="get" className="panel panel-pad" style={{marginTop:16}}><div className="visto-panel-head"><div><h2>Filtros</h2><p>Selecione uma obra ou consolide a empresa</p></div></div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}><label className="field-wrap" style={{flex:'1 1 260px'}}><span className="field">Obra</span><select className="input" name="obra" defaultValue={selected?.id||''}><option value="">Todas as obras</option>{all.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="btn" type="submit">Atualizar painel</button></div>
    </form>
    <div className="visto-kpi-grid" style={{marginTop:17}}>{cards.map(c=><article className="visto-kpi" key={c.label}><div className="visto-kpi-top"><span>{c.label}</span>{c.icon}</div><strong style={{fontSize:22}}>{c.value}</strong></article>)}</div>
    <section className="panel panel-pad space-top"><h2 className="subheading">Evolução físico-financeira — referência calculada</h2><p className="muted small">Proporção entre valores aprovados e planejados, sem reclassificar metas ou replanejamento como execução.</p>
      <div className="visto-progressbar" aria-label={`Avanço ${ratio}%`}><div style={{width:`${ratio}%`}}/></div><div className="visto-meta-strip"><span>Planejado: <b>{v(planned)}</b></span><span>Realizado: <b>{v(realized)}</b></span><span>Avanço: <b>{ratio}%</b></span></div>
    </section>
    <section className="panel panel-pad space-top"><div className="visto-panel-head"><div><h2>Formulários operacionais</h2><p>Fluxos derivados dos modelos de planilhas fornecidos</p></div></div><div className="visto-module-shortcuts">
      {[
        ['ADM-010','Cadastro de Obras'],['OBR-000','Itens de Orçamento'],['OBR-001','Diário de Obras'],['OBR-002','Realizado e Aprovações'],
        ['OBR-003','Planejado'],['OBR-004','Replanejado'],['OBR-005','Metas'],['ADM-006','Funcionários'],['ADM-004','Transferências']
      ].map(([code,name])=><Link key={code} href={`/erp/${organizationId}/formularios/${code}`}><b>{code}</b><span>{name}</span><ArrowUpRight size={15}/></Link>)}
    </div></section>
    <p className="visto-beta">Indicadores calculados a partir dos lançamentos do banco. O Painel de Obras original contém outras fontes, como perfuração, frota e não conformidades, que ainda precisam de modelagem específica.</p>
  </>;
}
