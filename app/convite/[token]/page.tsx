import Link from 'next/link';
import {acceptInvite} from './actions';
import {requireUser} from '@/lib/tenant';
export default async function Invitation({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  const {user}=await requireUser();
  return <main className="auth-wrap"><div className="panel auth-card"><Link href="/erp" className="brand"><span className="brand-icon">V</span>Visto ERP</Link>
    <h1>Convite para organização</h1><p className="muted small">Você está conectado como <b>{user.email}</b>. O convite só será aceito se este email for o destinatário e estiver confirmado.</p>
    <form action={acceptInvite} style={{marginTop:26}}><input type="hidden" name="token" value={token}/><button type="submit" className="btn">Aceitar convite</button></form>
    <div className="auth-foot"><Link href="/erp">Voltar às empresas</Link></div>
  </div></main>;
}
