import Link from 'next/link';
import {Building2,Plus,ArrowRight} from 'lucide-react';
import {requireUser} from '@/lib/tenant';
import {signOut} from '@/app/actions';
export default async function SelectOrganization({searchParams}:{searchParams:Promise<{erro?:string}>}) {
  const {supabase,user}=await requireUser();
  const {data:memberships}=await supabase.from('organization_members')
    .select('organization_id,role,organizations(id,name)')
    .eq('user_id',user.id).eq('status','active');
  return <main className="shell"><header className="site-header"><Link href="/" className="brand"><span className="brand-icon">V</span>Visto ERP</Link><form action={signOut}><button className="btn btn-ghost">Sair</button></form></header>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap',marginTop:50}}><div><div className="eyebrow">SEUS AMBIENTES</div><h1 className="page-title">Selecione uma empresa</h1><p className="muted">Você pode participar de mais de uma organização usando o mesmo login.</p></div><Link className="btn" href="/nova-empresa"><Plus size={16}/>Nova empresa</Link></div>
    {(await searchParams).erro && <p className="note note-error">Convite não aceito. Verifique o link, seu email e o prazo de validade.</p>}
    <div className="org-cards">{memberships?.map((m)=>{
      const o=m.organizations as unknown as {id:string;name:string}|null;
      return o&&<Link href={`/erp/${o.id}`} className="panel org-card" key={o.id}><div className="module-icon"><Building2 size={19}/></div><h3>{o.name}</h3><p className="muted small">Perfil: {m.role}</p><div style={{display:'flex',alignItems:'center',gap:7,color:'#1863c4',fontSize:13,fontWeight:700,marginTop:30}}>Abrir ambiente <ArrowRight size={15}/></div></Link>;
    })}</div>
    {(!memberships||memberships.length===0)&&<div className="panel empty space-top">Nenhuma empresa associada à sua conta. Crie um ambiente ou abra o convite recebido.</div>}
  </main>;
}
