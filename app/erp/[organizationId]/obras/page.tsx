import {redirect} from 'next/navigation';
import {HardHat,Plus} from 'lucide-react';
import {requireOrganization} from '@/lib/tenant';
import {addProject,updateProjectStatus} from '@/app/erp/actions';
import {money,date} from '@/lib/format';

export default async function Projects({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{erro?:string;sucesso?:string}>}){
  const {organizationId}=await params;
  const {supabase}=await requireOrganization(organizationId);
  const {data:licensed}=await supabase.rpc('can_use_module',{p_org_id:organizationId,p_module:'obras'});
  if(!licensed) redirect(`/erp/${organizationId}/modulos?erro=acesso`);
  const {data:projects,error}=await supabase.from('projects').select('id,name,code,status,budget_cents,created_at').eq('organization_id',organizationId).order('created_at',{ascending:false});
  const query=await searchParams;
  return <><div className="eyebrow">MÓDULO OPERACIONAL</div><h1 className="page-title">Gestão de Obras</h1><p className="muted small">Cadastre obras e acompanhe o estágio de execução. Funcionalidades avançadas serão adicionadas em versões posteriores.</p>
    {query.erro&&<p className="note note-error">Não foi possível gravar. Confira os dados, a licença ou suas permissões.</p>}
    {query.sucesso&&<p className="note">Obra cadastrada com sucesso.</p>}
    <section className="panel panel-pad space-top"><h2 className="subheading"><Plus size={17} style={{verticalAlign:'-3px',marginRight:7}}/>Nova obra</h2><form action={addProject}>
      <input type="hidden" name="orgId" value={organizationId}/><div className="form-grid">
        <div className="field-wrap"><label htmlFor="name" className="field">Nome da obra *</label><input className="input" id="name" name="name" required minLength={2} maxLength={120} placeholder="Ex.: Contenção Km 100"/></div>
        <div className="field-wrap"><label htmlFor="code" className="field">Código</label><input className="input" id="code" name="code" maxLength={30} placeholder="OBR-001"/></div>
        <div className="field-wrap"><label htmlFor="budget" className="field">Orçamento (R$)</label><input className="input" id="budget" name="budget" type="number" min="0" step="0.01" placeholder="125000.00"/></div>
      </div><button className="btn" type="submit"><Plus size={16}/>Cadastrar obra</button></form></section>
    <section className="panel panel-pad space-top"><h2 className="subheading"><HardHat size={17} style={{verticalAlign:'-3px',marginRight:7}}/>Obras cadastradas ({projects?.length??0})</h2>
      {error&&<p className="note note-error">Erro ao listar as obras.</p>}
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Obra</th><th>Código</th><th>Orçamento</th><th>Data</th><th>Status</th></tr></thead><tbody>
        {projects?.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.code||'—'}</td><td>{money(p.budget_cents)}</td><td>{date(p.created_at)}</td><td><form action={updateProjectStatus} style={{display:'flex',gap:6}}><input type="hidden" name="orgId" value={organizationId}/><input type="hidden" name="projectId" value={p.id}/><select name="status" className="input" defaultValue={p.status} style={{minWidth:150,padding:8}}>
          <option value="planejada">Planejada</option><option value="em_andamento">Em andamento</option><option value="suspensa">Suspensa</option><option value="concluida">Concluída</option></select><button className="switch" type="submit">Salvar</button></form></td></tr>)}
      </tbody></table>{!projects?.length&&<p className="empty">Nenhuma obra cadastrada.</p>}</div></section>
  </>;
}
