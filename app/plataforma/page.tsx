import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Building2,Users,ShieldCheck,CreditCard} from 'lucide-react';
import {requireUser} from '@/lib/tenant';
export default async function Plataforma(){
 const {supabase}=await requireUser();
 const {data:authorized}=await supabase.rpc('is_platform_admin');
 if(!authorized)notFound();
 const {data,error}=await supabase.rpc('platform_overview');
 const v=(data||{}) as {organizations?:number;users?:number;trials?:number;active_subscriptions?:number;organizations_list?:{id:string;name:string;created_at:string;members:number;status:string}[]};
 return <main style={{minHeight:'100vh',background:'#f4f7fb',padding:'40px max(18px,calc((100vw - 1200px) / 2))'}}>
 <Link href="/erp" style={{color:'#375aaf',textDecoration:'none'}}>← Voltar aos ambientes</Link>
 <div className="eyebrow" style={{marginTop:26}}>ADMINISTRAÇÃO DA PLATAFORMA</div><h1 className="page-title">Visto ERP · Painel Master</h1>
 <p className="muted small">Visão exclusiva do operador SaaS. Não corresponde ao administrador de cada empresa.</p>
 {error&&<p className="note note-error">Falha ao consultar a plataforma. Execute a migração 005 e configure a conta administradora.</p>}
 <div className="visto-kpi-grid" style={{marginTop:20}}>{[
  ['Empresas',v.organizations||0,<Building2 key="i" size={18}/>],['Usuários vinculados',v.users||0,<Users key="i" size={18}/>],
  ['Em avaliação',v.trials||0,<ShieldCheck key="i" size={18}/>],['Assinaturas ativas',v.active_subscriptions||0,<CreditCard key="i" size={18}/>]
 ].map(([label,value,icon])=><article className="visto-kpi" key={String(label)}><div className="visto-kpi-top"><span>{label}</span>{icon}</div><strong>{value}</strong></article>)}</div>
 <section className="panel panel-pad space-top"><h2 className="subheading">Empresas cadastradas</h2>
 <div className="table-scroll"><table className="data-table"><thead><tr><th>Empresa</th><th>Usuários</th><th>Assinatura</th><th>Cadastro</th></tr></thead><tbody>
 {(v.organizations_list||[]).map(o=><tr key={o.id}><td>{o.name}</td><td>{o.members}</td><td>{o.status||'Sem assinatura'}</td><td>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td></tr>)}
 </tbody></table></div></section><p className="visto-beta">A cobrança automática ainda não está configurada. Não marque assinaturas como pagas sem confirmação de um provedor de pagamentos.</p>
 </main>;
}
