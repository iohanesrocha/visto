import Link from 'next/link';
import {ArrowRight,Boxes,ChartNoAxesCombined,ShieldCheck,Users,Workflow,LockKeyhole} from 'lucide-react';

export default function Home(){
  return <main className="shell">
    <header className="site-header"><div className="brand"><span className="brand-icon">V</span>Visto ERP</div>
      <div className="site-actions"><Link href="/entrar" className="btn btn-secondary">Entrar</Link><Link href="/cadastrar" className="btn">Criar conta <ArrowRight size={16}/></Link></div>
    </header>
    <div className="hero"><div><span className="pill">Plataforma empresarial modular · MVP</span>
      <h1>Uma plataforma.<br/><span style={{color:'#1b69cd'}}>Toda a gestão.</span></h1>
      <p className="muted">Cadastre sua empresa, organize equipes e centralize os processos em um ERP que cresce com os módulos necessários ao seu negócio.</p>
      <div className="hero-actions"><Link href="/cadastrar" className="btn">Testar por 14 dias <ArrowRight size={16}/></Link><Link href="/entrar" className="btn btn-ghost">Já tenho conta</Link></div>
      <p className="small muted" style={{marginTop:23}}>Versão inicial para homologação. Cobrança e recursos avançados ainda não habilitados.</p>
    </div><div className="hero-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><b>Visão empresarial</b><span className="pill">Visão demonstrativa</span></div>
      <div className="hero-samples"><div className="hero-sample"><ChartNoAxesCombined size={20}/><b>Obras</b><small>Planejamento e controle</small></div><div className="hero-sample"><Boxes size={20}/><b>Módulos</b><small>Ativação conforme o plano</small></div><div className="hero-sample"><Users size={20}/><b>Equipe</b><small>Perfis e convidados</small></div><div className="hero-sample"><ShieldCheck size={20}/><b>RLS</b><small>Dados isolados por empresa</small></div></div>
      <div style={{display:'flex',alignItems:'center',gap:9,marginTop:25,color:'#b5cce3',fontSize:12}}><LockKeyhole size={15}/> PostgreSQL + autenticação Supabase</div>
    </div></div>
    <section className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',marginBottom:50}}>
      {[{icon:<Workflow/>,name:'Multiempresa',text:'Cada empresa tem ambiente próprio e pode convidar colaboradores.'},{icon:<ShieldCheck/>,name:'Permissões',text:'O controle de acesso é aplicado diretamente no banco, não apenas na interface.'},{icon:<Boxes/>,name:'Modular',text:'Ative áreas do ERP de acordo com os serviços contratados.'}].map(x=><div className="panel panel-pad" key={x.name}><div className="module-icon">{x.icon}</div><h3>{x.name}</h3><p className="small muted">{x.text}</p></div>)}
    </section>
  </main>;
}
