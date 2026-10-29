'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useMemo,useState} from 'react';
import { LayoutDashboard,Shield,Tags,Wallet,ShoppingCart,FileText,Warehouse,Truck,ClipboardList,BedDouble,Layers,HardHat,ChevronDown,Search,Bell,LogOut,HelpCircle,Menu, X, Building2,PanelLeftClose,PanelLeftOpen,Sun, Moon, FolderOpen, CheckCircle2, ChevronRight, Settings2, Users, Plus } from 'lucide-react';
import {NAVIGATION,navHref} from '@/lib/navigation';
import {signOut} from '@/app/actions';
const iconMap={
  'layout-dashboard':LayoutDashboard,shield:Shield,tags:Tags,wallet:Wallet,'shopping-cart':ShoppingCart,
  'file-text':FileText,warehouse:Warehouse,truck:Truck,'clipboard-list':ClipboardList,
  'bed-double':BedDouble,layers:Layers,'hard-hat':HardHat
};
type Props={children:React.ReactNode;organizationId:string;organizationName:string;email:string;fullName:string;role:string;isPlatformAdmin?:boolean;enabledModules:string[]};
export function AppShell({children,organizationId,organizationName,email,fullName,role,isPlatformAdmin,enabledModules}:Props){
  const pathname=usePathname();
  const [menuOpen,setMenuOpen]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [query,setQuery]=useState('');
  const [dark,setDark]=useState(false);
  const activeModule=NAVIGATION.find(g=>g.items.some(item=>navHref(organizationId,g.slug,item)===pathname))?.slug;
  const [expanded,setExpanded]=useState<string[]>(activeModule?[activeModule]:[]);
  useEffect(()=>{if(activeModule)setExpanded(prev=>prev.includes(activeModule)?prev:[...prev,activeModule])},[activeModule]);
  const hits=useMemo(()=>NAVIGATION.flatMap(g=>g.items.map(item=>({label:item.label,group:g.label,href:navHref(organizationId,g.slug,item)})))
    .filter(i=>`${i.label} ${i.group}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))).slice(0,8),[query,organizationId]);
  const core=['gerencial','administracao','cadastros'];
  const displayName=fullName||email.split('@')[0]||'Usuário';
  const initials=displayName.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]?.toUpperCase()).join('');
  return <div className={`visto-app ${collapsed?'visto-collapsed':''} ${dark?'visto-dark':''}`}>
    {menuOpen&&<button type="button" aria-label="Fechar menu" className="visto-overlay" onClick={()=>setMenuOpen(false)}/>}
    <aside className={`visto-sidebar ${menuOpen?'visto-menu-open':''}`}>
      <div className="visto-sidebrand"><Link href={`/erp/${organizationId}`} className="visto-logo" onClick={()=>setMenuOpen(false)}><span className="visto-emblem">V</span><span className="visto-brandtext">Visto <b>ERP</b></span></Link><button type="button" className="visto-collapse" onClick={()=>setCollapsed(v=>!v)} title={collapsed?'Expandir menu':'Recolher menu'} aria-label={collapsed?'Expandir menu':'Recolher menu'}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button><button className="visto-mobile-close" type="button" onClick={()=>setMenuOpen(false)} aria-label="Fechar menu"><X size={18}/></button></div>
      <div className="visto-scrollnav"><div className="visto-nav-label">GERENCIAL</div>
        <nav aria-label="Menu principal">
          {NAVIGATION.map((g,index)=>{
            const Icon=iconMap[g.icon as keyof typeof iconMap]||Layers;
            const opened=expanded.includes(g.slug);
            const isCore=core.includes(g.slug);
            const permitted=isCore||enabledModules.includes(g.slug);
            return <div className={`visto-navgroup ${index>0?'visto-group-separated':''}`} key={g.slug}>
              <button type="button" onClick={()=>setExpanded(prev=>prev.includes(g.slug)?prev.filter(x=>x!==g.slug):[...prev,g.slug])} className={`visto-nav-main ${activeModule===g.slug?'visto-group-active':''}`} aria-expanded={opened} title={g.label}>
                <Icon size={16}/><span className="visto-navtext">{g.label}</span><span className="visto-navcount">{g.items.length}</span><ChevronDown size={13} className={`visto-nav-chevron ${opened?'rotated':''}`}/>
              </button>
              {opened&&!collapsed&&<div className="visto-submenu">{g.items.map(item=><Link key={item.screen} href={navHref(organizationId,g.slug,item)} onClick={()=>setMenuOpen(false)} className={`visto-subitem ${navHref(organizationId,g.slug,item)===pathname?'visto-active':''}`} title={!permitted?'Módulo depende de ativação':undefined}><span className="visto-subdot"/>{item.label}{!permitted&&<span className="visto-lock-dot" title="Não ativado">•</span>}</Link>)}</div>}
            </div>;
          })}
        </nav>
        <Link className="visto-reset" href={`/erp/${organizationId}`} onClick={()=>{setExpanded([]);setMenuOpen(false);setQuery('')}}><Settings2 size={13}/> Restaurar Padrão</Link>
      </div>
      <div className="visto-userfoot"><div className="visto-userrow"><span className="visto-avatar">{initials}</span><div className="visto-userinfo"><strong>{displayName}</strong><small>{role==='owner'?'Proprietário':role==='admin'?'Administrador':'Colaborador'}</small></div><span className="visto-presence"/></div>{isPlatformAdmin&&<Link href="/plataforma" className="visto-platform-link">Painel Master</Link>}<div className="visto-userlinks"><form action={signOut}><button type="submit"><LogOut size={15}/> <span>Sair</span></button></form><Link href="/ajuda"><HelpCircle size={15}/><span>Ajuda</span></Link></div></div>
    </aside>
    <div className="visto-right"><header className="visto-topbar"><button type="button" className="visto-hamburger" onClick={()=>setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><Link href="/erp" className="visto-company"><span className="visto-company-icon"><Building2 size={17}/></span><span className="visto-company-label"><strong title={organizationName}>{organizationName}</strong><small>{role==='owner'?'Proprietário':role==='admin'?'Administrador':'Colaborador'}</small></span><ChevronDown size={14}/></Link>
      <div className="visto-search-holder"><Search size={17}/><input aria-label="Buscar telas" placeholder="Buscar módulos e telas..." value={query} onChange={e=>setQuery(e.target.value)}/>{query.length>0&&<button aria-label="Limpar busca" type="button" onClick={()=>setQuery('')}><X size={15}/></button>}
        {query.trim()&&<div className="visto-search-results">{hits.length?hits.map(h=><Link href={h.href} key={h.href} onClick={()=>setQuery('')}><span>{h.label}</span><small>{h.group}</small><ChevronRight size={14}/></Link>):<p>Nenhuma tela encontrada.</p>}</div>}
      </div>
      <div className="visto-head-actions"><Link className="visto-head-pill" href={`/erp/${organizationId}/modulos`} title="Gerenciar módulos"><Plus size={18}/></Link><Link className="visto-head-icon" href={`/erp/${organizationId}/usuarios`} title="Equipe"><Users size={17}/></Link><Link className="visto-head-icon" href={`/erp/${organizationId}/operacional/gerencial/aprovacoes`} title="Central de aprovações"><Bell size={19}/></Link><button className="visto-head-icon" type="button" onClick={()=>setDark(v=>!v)} title="Alternar tema" aria-label="Alternar tema">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><Link className="visto-top-avatar" href={`/erp/${organizationId}/usuarios`} title={displayName}>{initials}</Link></div></header>
      <main className="visto-content" id="principal"><div className="visto-content-inner">{children}</div></main>
    </div>
  </div>;
}
