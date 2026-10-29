import {Users,UserPlus} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
import {InviteCreator} from '@/components/invite-creator';
import {date} from '@/lib/format';
export default async function Members({params}:{params:Promise<{organizationId:string}>}) {
  const {organizationId}=await params;
  const {supabase,role,user}=await requireOrganization(organizationId);
  if(!canManage(role)) return <section className="panel panel-pad"><h1 className="page-title">Equipe</h1><p className="note note-error">Acesso restrito à administração.</p></section>;
  const [{data:members},{data:invitations}]=await Promise.all([
    supabase.from('organization_members').select('user_id,role,status,joined_at').eq('organization_id',organizationId).order('joined_at'),
    supabase.from('invitations').select('id,email,role,created_at,expires_at,used_at').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(20)
  ]);
  const ids=members?.map(m=>m.user_id)||[];
  const {data:profiles}=ids.length?await supabase.from('profiles').select('user_id,full_name').in('user_id',ids):{data:[] as {user_id:string;full_name:string}[]};
  const names=new Map(profiles?.map(p=>[p.user_id,p.full_name]));
  return <><div className="eyebrow">ADMINISTRAÇÃO</div><h1 className="page-title">Usuários e convites</h1><p className="muted small">Administradores criam convites; as pessoas entram com uma conta própria. Não compartilhe senhas.</p>
    <section className="panel panel-pad space-top"><h2 className="subheading"><UserPlus size={17} style={{verticalAlign:'-3px',marginRight:7}}/>Convidar colaborador</h2><InviteCreator organizationId={organizationId}/></section>
    <section className="panel panel-pad space-top"><h2 className="subheading"><Users size={17} style={{verticalAlign:'-3px',marginRight:7}}/>Membros ativos ({members?.length??0})</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Perfil</th><th>Situação</th><th>Desde</th></tr></thead><tbody>{members?.map(m=><tr key={m.user_id}><td><b>{names.get(m.user_id)||'Usuário'}</b>{m.user_id===user.id&&<span className="small muted"> (você)</span>}</td><td>{m.role==='owner'?'Proprietário':m.role==='admin'?'Administrador':'Colaborador'}</td><td><span className="pill tag-green">{m.status}</span></td><td>{date(m.joined_at)}</td></tr>)}</tbody></table></div></section>
    <section className="panel panel-pad space-top"><h2 className="subheading">Convites recentes</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Email</th><th>Papel</th><th>Criado</th><th>Estado</th></tr></thead><tbody>{invitations?.map(inv=><tr key={inv.id}><td>{inv.email}</td><td>{inv.role}</td><td>{date(inv.created_at)}</td><td>{inv.used_at?'Aceito':new Date(inv.expires_at)<new Date()?'Expirado':'Pendente'}</td></tr>)}</tbody></table>{!invitations?.length&&<div className="empty">Nenhum convite criado.</div>}</div></section>
  </>;
}
