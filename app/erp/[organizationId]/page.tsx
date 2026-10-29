import Link from 'next/link';
import {HardHat,Users,Boxes,CalendarClock,ArrowUpRight,ShieldCheck,Building2,ClipboardCheck,Wallet,FileText} from 'lucide-react';
import {requireOrganization} from '@/lib/tenant';
import {date} from '@/lib/format';
import {PageHeading} from '@/components/erp/page-heading';
export default async function Dashboard({params}:{params:Promise<{organizationId:string}>}){
  const {organizationId}=await params;
  const {supabase,organization,role}=await requireOrganization(organizationId);
  const [{count:users},{count:projects},{data:modules},{data:subscriptions},{data:recent}]=await Promise.all([
    supabase.from('organization_members').select('*',{count:'exact',head:true}).eq('organization_id',organizationId).eq('status','active'),
    supabase.from('projects').select('*',{count:'exact',head:true}).eq('organization_id',organizationId),
    supabase.from('organization_modules').select('module_slug,enabled').eq('organization_id',organizationId),
    supabase.from('subscriptions').select('status,current_period_end,plans(name)').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(1),
    supabase.from('projects').select('id,name,status,created_at').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(5)
  ]);
  const sub=subscriptions?.[0];
  const days=sub?Math.max(0,Math.ceil((new Date(sub.current_period_end).getTime()-Date.now())/86400000)):0;
  const enabled=modules?.filter(m=>m.enabled).length??0;
  const base=`/erp/${organizationId}`;
  const stats=[
    {label:'Usuários ativos',value:users??0,sub:'Acessos da empresa',icon:<Users size={18}/>},
    {label:'Obras cadastradas',value:projects??0,sub:'Gestão de Obras',icon:<HardHat size={18}/>},
    {label:'Módulos ativos',value:enabled,sub:'Funcionalidades disponíveis',icon:<Boxes size={18}/>},
    {label:'Dias de avaliação',value:sub?.status==='trialing'?days:'—',sub:sub?.status==='trialing'?`Até ${date(sub.current_period_end)}`:'Ver plano',icon:<CalendarClock size={18}/>}
  ];
  return <><PageHeading title="Dash Gerencial" description={`Visão operacional de ${organization.name}. Informações atualizadas a partir dos registros do ERP.`} eyebrow="GERENCIAL" actions={<Link href={`${base}/obras`} className="btn"><HardHat size={15}/>Nova obra</Link>}/>
    <div className="visto-kpi-grid">{stats.map(s=><article className="visto-kpi" key={s.label}><div className="visto-kpi-top"><span>{s.label}</span>{s.icon}</div><strong>{s.value}</strong><small>{s.sub}</small></article>)}</div>
    <div className="visto-dashboard-grid"><section className="visto-surface"><div className="visto-panel-head"><div><h2>Obras recentes</h2><p>Últimos registros da empresa</p></div><Link href={`${base}/obras`}>Ver todas <ArrowUpRight size={14}/></Link></div><div className="visto-rowlist">{recent?.length?recent.map(p=><div key={p.id} className="visto-dash-row"><span className="visto-dash-icon"><HardHat size={17}/></span><div><b>{p.name}</b><small>Criada em {date(p.created_at)}</small></div><span className="visto-chip">{p.status.replaceAll('_',' ')}</span></div>):<div className="empty">Nenhuma obra cadastrada. <Link href={`${base}/obras`}>Cadastrar primeira obra</Link></div>}</div></section>
      <section className="visto-surface"><div className="visto-panel-head"><div><h2>Acesso rápido</h2><p>Administração e operações</p></div></div><div className="visto-quicklinks">{[
        {name:'Central de Aprovações',href:`${base}/operacional/gerencial/aprovacoes`,icon:<ClipboardCheck size={17}/>},
        {name:'Contas a Pagar',href:`${base}/operacional/financeiro/contas-a-pagar`,icon:<Wallet size={17}/>},
        {name:'Documentos (GED)',href:`${base}/operacional/gerencial/documentos`,icon:<FileText size={17}/>},
        {name:'Usuários e permissões',href:`${base}/usuarios`,icon:<Users size={17}/>},
        {name:'Módulos contratados',href:`${base}/modulos`,icon:<Boxes size={17}/>}
      ].map(x=><Link className="visto-quicklink" href={x.href} key={x.name}>{x.icon}<span>{x.name}</span><ArrowUpRight size={15}/></Link>)}</div></section></div>
    <div className="visto-dash-bottom"><ShieldCheck size={16}/><span>Seu perfil: {role==='owner'?'Proprietário':role==='admin'?'Administrador':'Colaborador'}.</span><Building2 size={16}/><span>Ambiente multiempresa com políticas RLS no Supabase.</span></div>
    <p className="visto-beta"><b>Homologação:</b> esta versão ainda não possui cobrança automática e não está validada para operações fiscais ou contábeis oficiais.</p>
  </>;
}
