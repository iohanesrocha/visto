import {notFound,redirect} from 'next/navigation';
import Link from 'next/link';
import {FilePlus2,ShieldCheck,Check, X,ArrowUpRight} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
import {FormField,getForm} from '@/lib/forms/catalog';
import {submitVistoForm,decideVistoRecord} from '@/app/erp/form-actions';
import {money} from '@/lib/format';

const strings:Record<string,string>={employee_number:'Matrícula',name:'Nome',role_title:'Função',status:'Status',admission_date:'Admissão',
  project_id:'Obra',work_date:'Data',report_date:'Data',month:'Competência',start_date:'Início',end_date:'Término',
  work_item_id:'Item',item_code:'Código do item',description:'Descrição',unit:'Unid.',budget_quantity:'Qtd. contratada',
  quantity:'Quantidade',quantity_service:'Serviços',quantity_supply:'Fornecimento',amount_cents:'Valor',
  unit_price_cents:'Valor unit.',target_cents:'Meta',revised_amount_cents:'Valor replanejado',revised_quantity:'Qtd. replanejada',
  employee_id:'Colaborador',to_project_id:'Para obra',from_project_id:'Da obra',effective_date:'Data efetiva',
  weather:'Tempo',headcount:'Efetivo',activities:'Atividades',budget_cents:'Orçamento',code:'Código',created_at:'Cadastro',updated_at:'Atualização'};
function formatValue(key:string,value:unknown,proj:Record<string,string>,emp:Record<string,string>,item:Record<string,string>){
  if(value===null||value===undefined||value==='')return '—';
  if(key==='project_id'||key==='to_project_id'||key==='from_project_id')return proj[String(value)]||String(value).slice(0,8);
  if(key==='employee_id')return emp[String(value)]||String(value).slice(0,8);
  if(key==='work_item_id')return item[String(value)]||String(value).slice(0,8);
  if(['amount_cents','revised_amount_cents','target_cents','unit_price_cents','budget_cents'].includes(key))return money(Number(value));
  if(key.endsWith('_at')||key.endsWith('_date')||key==='month'||key==='work_date'||key==='report_date'||key==='effective_date'){
    const d=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat('pt-BR').format(d);
  }
  return String(value).length>85?String(value).slice(0,85)+'…':String(value);
}
function Field({field,projects,employees,items}:{field:FormField;projects:{id:string;name:string}[];employees:{id:string;name:string}[];items:{id:string;item_code:string;description:string}[]}){
  const common={id:field.name,name:field.name,required:field.required||false};
  let input:React.ReactNode;
  if(field.type==='textarea')input=<textarea {...common} className="input" rows={3} maxLength={2000} placeholder={field.placeholder}/>;
  else if(field.type==='checkbox')input=<label className="visto-check"><input type="checkbox" name={field.name}/>{field.label}</label>;
  else if(['project','employee','work_item','select'].includes(field.type)){
    const options=field.type==='project'?projects.map(x=>({value:x.id,label:x.name})):field.type==='employee'?employees.map(x=>({value:x.id,label:x.name})):field.type==='work_item'?items.map(x=>({value:x.id,label:`${x.item_code} — ${x.description}`})):(field.options||[]).map(x=>({value:x,label:x}));
    input=<select {...common} className="input" defaultValue=""><option value="">Selecione...</option>{options.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>;
  }else input=<input {...common} className="input" type={field.type==='money'||field.type==='number'?'number':field.type==='date'?'date':'text'} min={field.type==='money'||field.type==='number'?0:undefined} step={field.type==='money'?'0.01':field.type==='number'?'any':undefined} maxLength={field.type==='text'?180:undefined} placeholder={field.placeholder}/>;
  return <div className={`field-wrap ${field.type==='checkbox'?'visto-field-check':''}`} key={field.name}>{field.type!=='checkbox'&&<label className="field" htmlFor={field.name}>{field.label}{field.required?' *':''}</label>}{input}</div>;
}
export default async function VistoForm({params,searchParams}:{params:Promise<{organizationId:string;code:string}>;searchParams:Promise<{erro?:string;sucesso?:string}>}){
  const {organizationId,code}=await params;const spec=getForm(code);if(!spec)notFound();
  const {supabase,role}=await requireOrganization(organizationId);
  const {data:allowed}=await supabase.rpc('can_use_module',{p_org_id:organizationId,p_module:spec.module});
  if(!allowed)redirect(`/erp/${organizationId}/modulos?erro=acesso`);
  const [{data:projects},{data:employees},{data:workItems},{data:records,error}]=await Promise.all([
    supabase.from('projects').select('id,name').eq('organization_id',organizationId).order('name').limit(1000),
    supabase.from('employees').select('id,name').eq('organization_id',organizationId).order('name').limit(1000),
    supabase.from('work_items').select('id,item_code,description').eq('organization_id',organizationId).order('item_code').limit(1000),
    supabase.from(spec.table).select(['id',...spec.list].filter((x,i,a)=>a.indexOf(x)===i).join(',')).eq('organization_id',organizationId).order(spec.list[0]==='name'?'name':spec.list[0],{ascending:false}).limit(100)
  ]);
  const projectOptions=(projects||[]) as {id:string;name:string}[];
  const employeeOptions=(employees||[]) as {id:string;name:string}[];
  const itemOptions=(workItems||[]) as {id:string;item_code:string;description:string}[];
  const projectMap=Object.fromEntries(projectOptions.map(p=>[p.id,p.name]));
  const empMap=Object.fromEntries(employeeOptions.map(p=>[p.id,p.name]));
  const itemMap=Object.fromEntries(itemOptions.map(p=>[p.id,p.item_code]));
  const query=await searchParams;
  const editable=!spec.readOnly&&(!spec.managerOnly||canManage(role));
  const rows=(records||[]) as unknown as Record<string,unknown>[];
  return <><div className="eyebrow">VISTO ERP / FORMULÁRIOS / {spec.code}</div>
    <h1 className="page-title">{spec.title}</h1><p className="muted small">{spec.description}</p>
    <div className="visto-meta-strip"><span>Documento: <b>{spec.code}</b></span><span>Referência anterior: <b>{spec.legacy}</b></span><span>Registros exibidos: <b>{rows.length}</b></span></div>
    {query.erro&&<p className="note note-error">Não foi possível concluir a operação. Confira as permissões, os campos e os relacionamentos entre obra e item.</p>}
    {query.sucesso&&<p className="note">Operação concluída.</p>}
    {editable&&<section className="panel panel-pad space-top"><h2 className="subheading"><FilePlus2 size={17}/> Novo registro</h2><form action={submitVistoForm}>
      <input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="code" value={spec.code}/>
      <div className="visto-form-grid">{spec.fields.map(field=><Field field={field} key={field.name} projects={projectOptions} employees={employeeOptions} items={itemOptions}/>)}</div>
      <div className="visto-form-actions"><button className="btn" type="submit"><FilePlus2 size={15}/>Salvar registro</button>
        <small className="muted">Todos os lançamentos são vinculados à empresa autenticada.</small></div>
    </form></section>}
    {!editable&&!spec.readOnly&&<p className="note">Somente administradores da empresa podem cadastrar nesta tela.</p>}
    <section className="panel panel-pad space-top"><div className="visto-panel-head"><div><h2>Histórico de registros</h2><p>Últimos 100 lançamentos. Dados restritos ao ambiente da empresa.</p></div></div>
      {error&&<p className="note note-error">Falha ao consultar. Verifique se a migração `003_obras_rh.sql` foi aplicada e as permissões RLS.</p>}
      <div className="table-scroll"><table className="data-table"><thead><tr>{spec.list.map(key=><th key={key}>{strings[key]||key}</th>)}{spec.code==='OBR-002'||spec.code==='ADM-004'?<th>Aprovação</th>:null}</tr></thead><tbody>
      {rows.map((row,i)=><tr key={String(row.id||i)}>{spec.list.map(k=><td key={k}>{spec.code==='ADM-008P'&&k==='name'?<Link href={`/erp/${organizationId}/funcionarios/${String(row.id)}`}>{String(row[k]||'Ver perfil')}</Link>:formatValue(k,row[k],projectMap,empMap,itemMap)}</td>)}
        {spec.code==='OBR-002'||spec.code==='ADM-004'?<td>{row.status==='pendente'&&canManage(role)?<div className="visto-decision-actions">
          <form action={decideVistoRecord}><input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="recordId" value={String(row.id)}/><input type="hidden" name="kind" value={spec.code==='OBR-002'?'production':'transfer'}/><input type="hidden" name="decision" value="approve"/><button className="switch" type="submit" title="Aprovar"><Check size={14}/></button></form>
          <form action={decideVistoRecord}><input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="recordId" value={String(row.id)}/><input type="hidden" name="kind" value={spec.code==='OBR-002'?'production':'transfer'}/><input type="hidden" name="decision" value="reject"/><input className="input" name="reason" placeholder="Motivo da recusa" minLength={3}/><button className="switch" type="submit" title="Recusar"><X size={14}/></button></form>
        </div>:<span className="visto-chip">{String(row.status||'—')}</span>}</td>:null}
      </tr>)}</tbody></table>{!rows.length&&<p className="empty">Nenhum registro cadastrado neste formulário.</p>}</div>
      {(spec.code==='ADM-008L'||spec.code==='ADM-008P')&&<p className="muted small" style={{marginTop:12}}><ShieldCheck size={14} style={{verticalAlign:'-3px'}}/> Informações pessoais e médicas não são exibidas nesta listagem.</p>}
    </section><div className="visto-form-footer"><Link href={`/erp/${organizationId}/painel-obras`}>Painel de Obras <ArrowUpRight size={15}/></Link></div>
  </>;
}
