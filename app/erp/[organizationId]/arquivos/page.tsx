import {FileText,LockKeyhole,Upload} from 'lucide-react';
import {requireOrganization} from '@/lib/tenant';
export default async function Arquivos({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{erro?:string;sucesso?:string}>}){
 const {organizationId}=await params;const {supabase}=await requireOrganization(organizationId);const query=await searchParams;
 const [{data:files},{data:projects}]=await Promise.all([
   supabase.from('file_registry').select('id,original_name,mime_type,size_bytes,created_at').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(100),
   supabase.from('projects').select('id,name').eq('organization_id',organizationId).order('name')
 ]);
 return <><div className="eyebrow">GERENCIAL / GED</div><h1 className="page-title">Documentos do Visto ERP</h1>
 <p className="muted small">Armazenamento centralizado no Google Drive, segregado por pasta de empresa. Os acessos são intermediados pelo backend.</p>
 {query.erro&&<p className="note note-error">Upload bloqueado. Verifique conexão Google Drive, compartilhamento privado, tipo do arquivo e permissões.</p>}
 {query.sucesso&&<p className="note">Anexo cadastrado no Drive e na empresa.</p>}
 <section className="panel panel-pad space-top"><h2 className="subheading"><Upload size={16}/> Enviar documento</h2>
 <form action="/api/arquivos" method="POST" encType="multipart/form-data">
 <input type="hidden" name="organizationId" value={organizationId}/>
 <div className="visto-form-grid"><div className="field-wrap"><label className="field" htmlFor="file">Arquivo (PDF ou imagem, até 10 MB)</label><input id="file" name="file" className="input" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required/></div>
 <div className="field-wrap"><label className="field" htmlFor="projectId">Vincular à obra (opcional)</label><select id="projectId" name="projectId" className="input" defaultValue=""><option value="">Documento geral</option>{projects?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
 <button className="btn" type="submit"><Upload size={15}/>Salvar no Google Drive</button></form>
 <p className="muted small" style={{marginTop:12}}><LockKeyhole size={15} style={{verticalAlign:'-3px'}}/> Uploads permanecem bloqueados enquanto a pasta raiz tiver compartilhamento público ou amplo.</p>
 </section>
 <section className="panel panel-pad space-top"><h2 className="subheading"><FileText size={16}/> Arquivos registrados ({files?.length||0})</h2><div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Tamanho</th><th>Enviado em</th></tr></thead><tbody>{files?.map(f=><tr key={f.id}><td>{f.original_name}</td><td>{f.mime_type}</td><td>{Math.round(f.size_bytes/1024)} KB</td><td>{new Date(f.created_at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table>{!files?.length&&<p className="empty">Ainda não há documentos vinculados à empresa.</p>}</div></section>
 </>;
}
