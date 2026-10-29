import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {requireOrganization} from '@/lib/tenant';
import {writeDocumentToDrive} from '@/lib/drive/client';
export const runtime='nodejs';
const accepted=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
export async function POST(request:NextRequest){
  const form=await request.formData();
  const organizationId=String(form.get('organizationId')||'');
  if(!/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(organizationId))return NextResponse.json({error:'Empresa inválida'},{status:400});
  const {supabase,user}=await requireOrganization(organizationId);
  const {data:licensed}=await supabase.rpc('can_use_module',{p_org_id:organizationId,p_module:'gerencial'});
  if(!licensed)return NextResponse.json({error:'Plano sem acesso ao GED'},{status:403});
  const file=form.get('file');
  if(!(file instanceof File)||file.size===0||file.size>10*1024*1024||!accepted.has(file.type))return NextResponse.json({error:'Anexo deve ser PDF/JPG/PNG/WEBP até 10 MB'},{status:400});
  const projectId=String(form.get('projectId')||'');
  if(projectId){
    const {data:project}=await supabase.from('projects').select('id').eq('id',projectId).eq('organization_id',organizationId).maybeSingle();
    if(!project)return NextResponse.json({error:'Obra inválida'},{status:400});
  }
  const name=file.name.replaceAll(/[\\/\r\n]/g,'_').replace(/[^a-zA-Z0-9_.À-ÿ -]/g,'').slice(0,95)||'documento';
  const persistedName=`${randomUUID()}_${name}`;
  try{
    const bytes=Buffer.from(await file.arrayBuffer());
    // A pasta deve estar privada. Se houver permissão anyone/domain, o upload será bloqueado.
    const drive=await writeDocumentToDrive(organizationId,bytes,persistedName,file.type);
    const {error}=await supabase.from('file_registry').insert({organization_id:organizationId,project_id:projectId||null,
      entity_type:projectId?'project':'organization',original_name:name,mime_type:file.type,size_bytes:bytes.length,
      drive_file_id:drive.fileId,drive_folder_id:drive.folderId,uploaded_by:user.id});
    if(error)throw error;
    return NextResponse.redirect(new URL(`/erp/${organizationId}/arquivos?sucesso=1`,request.url),303);
  }catch(e){
    console.error('Falha segura no armazenamento:',e instanceof Error?e.message:'erro');
    return NextResponse.redirect(new URL(`/erp/${organizationId}/arquivos?erro=1`,request.url),303);
  }
}
