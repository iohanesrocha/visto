import Link from 'next/link';
import {ShieldCheck} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
import {date} from '@/lib/format';
import {PageHeading} from '@/components/erp/page-heading';
export default async function Audit({params}:{params:Promise<{organizationId:string}>}){
  const {organizationId}=await params;
  const {supabase,role}=await requireOrganization(organizationId);
  if(!canManage(role)) return <section className="visto-surface visto-locked"><h1>Acesso restrito</h1><p>A auditoria só pode ser visualizada por administradores.</p></section>;
  const {data:logs,error}=await supabase.from('audit_logs').select('id,created_at,actor_id,action,entity,event_data').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(100);
  return <><PageHeading title="Auditoria" eyebrow="ADMINISTRAÇÃO" description="Histórico das alterações registradas pelo banco de dados." actions={<Link href={`/erp/${organizationId}/usuarios`} className="btn btn-ghost"><ShieldCheck size={15}/> Usuários</Link>}/>
    <section className="visto-surface"><div className="visto-panel-head"><div><h2>Últimos eventos</h2><p>As 100 operações mais recentes</p></div></div>
      {error&&<p className="note note-error">Falha ao carregar o histórico de auditoria.</p>}
      <div className="visto-table-wrapper"><table className="visto-table"><thead><tr><th>DATA</th><th>AÇÃO</th><th>ENTIDADE</th><th>USUÁRIO</th><th>RESUMO</th></tr></thead><tbody>{logs?.map(log=><tr key={log.id}><td>{date(log.created_at)}</td><td><b>{log.action}</b></td><td>{log.entity}</td><td>{log.actor_id?.slice(0,8)||'Sistema'}</td><td><code>{JSON.stringify(log.event_data).slice(0,120)}</code></td></tr>)}</tbody></table>{!logs?.length&&<div className="visto-empty">Nenhum evento registrado.</div>}</div>
    </section><p className="visto-beta">A trilha atual acompanha obras e registros genéricos. Ações administrativas, consultas e eventos externos deverão ser incluídos antes da operação comercial.</p></>;
}
