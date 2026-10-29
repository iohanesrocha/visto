import Link from 'next/link';
import { signUp } from '@/app/actions';
export default async function Cadastrar({searchParams}:{searchParams:Promise<{erro?:string}>}){
  const query=await searchParams;
  return <main className="auth-wrap"><div className="panel auth-card"><Link href="/" className="brand"><span className="brand-icon">V</span>Visto ERP</Link>
    <h1>Crie sua conta</h1><p className="muted small">Depois de confirmar o email, você poderá registrar a empresa.</p>
    {query.erro&&<p className="note note-error">Cadastro não concluído. Verifique os campos e tente novamente.</p>}
    <form action={signUp} style={{marginTop:24}}><div className="field-wrap"><label className="field" htmlFor="name">Seu nome</label><input id="name" name="name" className="input" minLength={2} maxLength={120} required autoComplete="name"/></div>
      <div className="field-wrap"><label className="field" htmlFor="email">Email profissional</label><input id="email" name="email" type="email" className="input" required autoComplete="email"/></div>
      <div className="field-wrap"><label className="field" htmlFor="password">Senha (mínimo 8 caracteres)</label><input id="password" name="password" type="password" className="input" required minLength={8} autoComplete="new-password"/></div>
      <button className="btn" type="submit">Criar conta</button></form>
    <div className="auth-foot">Já possui conta? <Link href="/entrar">Entrar</Link></div>
  </div></main>;
}
