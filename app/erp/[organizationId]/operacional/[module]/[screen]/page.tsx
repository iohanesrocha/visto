import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,Filter,Plus,Save,Search} from 'lucide-react';
import {requireOrganization} from '@/lib/tenant';
import {getItem} from '@/lib/navigation';
import {PageHeading,ModuleNotice} from '@/components/erp/page-heading';
import {createModuleRecord,changeModuleRecordStatus} from '@/app/erp/operational-actions';
import {date,money} from '@/lib/format';
type Props={params:Promise<{organizationId:string;module:string;screen:string}>;searchParams:Promise<{q?:string;erro?:string;sucesso?:string}>};
const statuses:{key:string;label:string}[]=[{key:'rascunho',label:'Rascunho'},{key:'em_analise',label:'Em análise'},{key:'concluido',label:'Concluído'},{key:'cancelado',label:'Cancelado'}];
export default async function OperationalPage({params,searchParams}:Props){
  const {organizationId,module,screen}=await params;
  const meta=getItem(module,screen);
  if(!meta||meta.item.shortcut) notFound();
  const {supabase}=await requireOrganization(organizationId);
  const [permission,query]=await Promise.all([
    supabase.rpc('can_use_module',{p_org_id:organizationId,p_module:module}),searchParams
  ]);
  const allowed=permission.data===true;
  const search=(query.q||'').slice(0,100).trim();
  let records:{id:string;title:string;reference:string|null;amount_cents:number|null;status:string;description:string|null;occurred_on:string|null;created_at:string}[]=[];
  let fetchError='';
  if(allowed){
    let db=supabase.from('module_records').select('id,title,reference,amount_cents,status,description,occurred_on,created_at')
      .eq('organization_id',organizationId).eq('module_slug',module).eq('screen_slug',screen).order('created_at',{ascending:false}).limit(100);
    if(search) db=db.ilike('title',`%${search.replaceAll('%','').replaceAll('_','')}%`);
    const {data,error}=await db;
    records=data||[];
    fetchError=error?'Não foi possível consultar os registros. Confira a migração SQL 002 e as permissões.':'';
  }
  const base=`/erp/${organizationId}`;
  return <><PageHeading title={meta.item.label} description={`Gerencie os registros de ${meta.item.label.toLocaleLowerCase('pt-BR')} no ambiente da sua empresa.`} eyebrow={meta.group.label.toUpperCase()}
    actions={<Link href={base} className="btn btn-ghost"><ArrowLeft size={15}/> Dashboard</Link>}/>
    {!allowed?<section className="visto-surface visto-locked"><h2>Acesso ao módulo indisponível</h2><p>Seu plano pode estar vencido ou o módulo <strong>{meta.group.label}</strong> ainda não foi ativado pelo administrador.</p><Link className="btn" href={`${base}/modulos`}>Consultar módulos contratados</Link></section>:<>
      {query.erro&&<p role="alert" className="note note-error">Não foi possível salvar. Confira os campos, permissões e assinatura.</p>}
      {query.sucesso&&<p role="status" className="note">Registro salvo com sucesso.</p>}
      <section className="visto-surface visto-form-surface"><div className="visto-panel-head"><div><h2><Plus size={17}/> Novo registro</h2><p>Preencha os dados principais para iniciar o acompanhamento.</p></div></div>
        <form action={createModuleRecord} className="visto-record-form"><input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="module" value={module}/><input type="hidden" name="screen" value={screen}/>
        <div className="visto-field-grid"><div><label className="field" htmlFor="title">Descrição / título *</label><input className="input" name="title" id="title" required minLength={2} maxLength={160} placeholder={`Novo registro de ${meta.item.label}`}/></div>
          <div><label className="field" htmlFor="reference">Referência</label><input className="input" id="reference" name="reference" maxLength={60} placeholder="Código ou documento"/></div>
          <div><label className="field" htmlFor="amount">Valor estimado (R$)</label><input className="input" id="amount" name="amount" type="number" min="0" max="999999999999.99" step="0.01" placeholder="0,00"/></div>
          <div><label className="field" htmlFor="occurred_on">Data</label><input className="input" id="occurred_on" name="occurred_on" type="date"/></div></div>
          <div><label className="field" htmlFor="description">Observações</label><textarea className="input" id="description" name="description" rows={2} maxLength={2000} placeholder="Informações adicionais (opcional)"/></div>
          <div className="visto-form-actions"><button className="btn" type="submit"><Save size={15}/> Salvar registro</button></div></form>
      </section>
      <section className="visto-surface"><div className="visto-panel-head"><div><h2>Registros cadastrados</h2><p>Últimos 100 registros encontrados · ordenados por inclusão</p></div><span className="visto-table-count">{records.length} registro(s)</span></div>
        <form method="get" className="visto-filterbar"><div className="visto-filter-input"><Search size={16}/><input name="q" aria-label="Buscar por título" defaultValue={search} placeholder="Buscar descrição do registro" maxLength={100}/></div><button className="visto-filter-button" type="submit"><Filter size={15}/> Filtrar</button>{search&&<Link href={`${base}/operacional/${module}/${screen}`} className="visto-filter-reset">Limpar</Link>}</form>
        {fetchError&&<p role="alert" className="note note-error">{fetchError}</p>}
        <div className="visto-table-wrapper"><table className="visto-table"><thead><tr><th>DATA</th><th>REFERÊNCIA</th><th>DESCRIÇÃO</th><th>VALOR</th><th>STATUS</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td className="visto-nowrap">{r.occurred_on?date(r.occurred_on+'T12:00:00'):date(r.created_at)}</td><td className="visto-nowrap">{r.reference||'—'}</td><td><strong>{r.title}</strong>{r.description&&<small title={r.description}>{r.description}</small>}</td><td className="visto-nowrap">{money(r.amount_cents)}</td><td><form action={changeModuleRecordStatus} className="visto-status-form"><input name="organizationId" type="hidden" value={organizationId}/><input name="module" type="hidden" value={module}/><input name="screen" type="hidden" value={screen}/><input name="recordId" type="hidden" value={r.id}/><select name="status" defaultValue={r.status} aria-label={`Status do registro ${r.title}`}>{statuses.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select><button type="submit" title="Salvar status" aria-label={`Salvar status de ${r.title}`}><Save size={14}/></button></form></td></tr>)}</tbody></table>
          {records.length===0&&!fetchError&&<div className="visto-empty">Nenhum registro encontrado. Use o formulário acima para cadastrar o primeiro.</div>}
        </div>
      </section><ModuleNotice/></>}
    </>;
}
