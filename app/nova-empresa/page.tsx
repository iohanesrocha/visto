import Link from 'next/link';
import {createOrganization} from '@/app/actions';
import {requireUser} from '@/lib/tenant';
export default async function NovaEmpresa({searchParams}:{searchParams:Promise<{erro?:string}>}){
  await requireUser();
  const query=await searchParams;
  return <main className="auth-wrap"><div className="panel auth-card"><Link href="/erp" className="brand"><span className="brand-icon">V</span>Visto ERP</Link>
    <h1>Cadastre sua empresa</h1><p className="muted small">Sua empresa terá dados e usuários independentes dos demais clientes.</p>
    {query.erro&&<p className="note note-error">Não foi possível registrar a empresa. Confirme o email e revise os campos.</p>}
    <form action={createOrganization} style={{marginTop:24}}><div className="field-wrap"><label className="field" htmlFor="name">Nome da empresa *</label><input id="name" name="name" className="input" minLength={2} maxLength={120} required placeholder="Ex.: Construtora Exemplo"/></div>
      <div className="field-wrap"><label className="field" htmlFor="document">CNPJ (opcional no teste)</label><input id="document" name="document" className="input" maxLength={30} placeholder="00.000.000/0001-00"/></div>
      <button className="btn" type="submit">Criar ambiente empresarial</button></form>
    <p className="muted tiny" style={{marginTop:17}}>O teste inicial dura 14 dias e permite até 5 usuários. Planos pagos ainda não estão habilitados.</p>
  </div></main>;
}
