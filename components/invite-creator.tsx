'use client';
import {useState} from 'react';
import {Copy,Send} from 'lucide-react';
export function InviteCreator({organizationId}:{organizationId:string}) {
  const [email,setEmail]=useState('');
  const [role,setRole]=useState('member');
  const [url,setUrl]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setUrl('');setLoading(true);
    try{
      const response=await fetch('/api/convites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organizationId,email,role})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||'Não foi possível criar o convite');
      setUrl(result.url);setEmail('');
    }catch(e){setError(e instanceof Error?e.message:'Falha ao gerar convite');}
    finally{setLoading(false);}
  }
  return <><form onSubmit={submit}><div className="form-grid"><div className="field-wrap"><label className="field" htmlFor="invite-email">Email do convidado</label><input id="invite-email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} placeholder="pessoa@empresa.com.br" required/></div>
    <div className="field-wrap"><label className="field" htmlFor="invite-role">Permissão</label><select id="invite-role" className="input" value={role} onChange={e=>setRole(e.target.value)}><option value="member">Colaborador</option><option value="admin">Administrador</option></select></div></div>
    <button className="btn" disabled={loading} type="submit"><Send size={16}/>{loading?'Gerando…':'Gerar link de convite'}</button></form>
    {error&&<p className="note note-error">{error}</p>}
    {url&&<div style={{marginTop:17}}><div className="note">Envie o link abaixo pelo seu canal de comunicação. Ele expira em 7 dias, é de uso único e só funciona para o email convidado, previamente confirmado.</div><p className="invite-result">{url}</p><button type="button" className="btn btn-secondary" onClick={()=>navigator.clipboard.writeText(url)}><Copy size={15}/>Copiar link</button></div>}
  </>;
}
