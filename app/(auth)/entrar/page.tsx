import Link from 'next/link';
import { signIn } from '@/app/actions';
export default async function Entrar({searchParams}:{searchParams:Promise<{erro?:string;mensagem?:string}>}){
  const query=await searchParams;
  return <main className="auth-wrap"><div className="panel auth-card"><Link href="/" className="brand"><span className="brand-icon">V</span>Visto ERP</Link>
    <h1>Bem-vindo de volta</h1><p className="muted small">Acesse o ambiente da sua empresa.</p>
    {query.erro&&<p className="note note-error">Não foi possível entrar. Revise os dados ou confirme seu email.</p>}
    {query.mensagem==='confirme'&&<p className="note">Verifique seu email para confirmar o cadastro. Depois, entre aqui.</p>}
    <form action={signIn} style={{marginTop:24}}><div className="field-wrap"><label className="field" htmlFor="email">Email</label><input id="email" className="input" name="email" type="email" defaultValue="iohanesd@gmail.com" required autoComplete="email"/></div>
    <div className="field-wrap"><label className="field" htmlFor="password">Senha</label><input id="password" className="input" name="password" type="password" minLength={8} required autoComplete="current-password"/></div><button className="btn" type="submit">Entrar no ERP</button></form>
    <div className="auth-foot">Não possui conta? <Link href="/cadastrar">Criar cadastro</Link></div>
  </div></main>;
}
