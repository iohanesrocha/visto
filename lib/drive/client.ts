import 'server-only';
import {google} from 'googleapis';
import {Readable} from 'node:stream';

export const DRIVE_ROOT_ID=process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID||'';
export function getDrive(){
  const {GOOGLE_DRIVE_CLIENT_ID:id,GOOGLE_DRIVE_CLIENT_SECRET:secret,GOOGLE_DRIVE_REFRESH_TOKEN:refresh}=process.env;
  if(!id||!secret||!refresh||!DRIVE_ROOT_ID)throw Error('Armazenamento Google Drive não configurado');
  const auth=new google.auth.OAuth2(id,secret);
  auth.setCredentials({refresh_token:refresh});
  return google.drive({version:'v3',auth});
}
export async function assertPrivateRoot(){
  const drive=getDrive();
  const {data}=await drive.permissions.list({fileId:DRIVE_ROOT_ID,fields:'permissions(id,type,role)',supportsAllDrives:true});
  if(data.permissions?.some(p=>p.type==='anyone'||p.type==='domain')){
    throw Error('Pasta raiz permite acesso coletivo/público. Restrinja o compartilhamento antes de enviar documentos.');
  }
  return drive;
}
function driveLiteral(s:string){return s.replaceAll('\\','\\\\').replaceAll("'","\\'");}
export async function ensureFolder(drive:ReturnType<typeof getDrive>,parent:string,name:string){
  const q=`'${driveLiteral(parent)}' in parents and name = '${driveLiteral(name)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const list=await drive.files.list({q,fields:'files(id,name)',pageSize:10});
  if(list.data.files?.[0]?.id)return list.data.files[0].id;
  const created=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.folder',parents:[parent]},fields:'id'});
  if(!created.data.id)throw Error('Não foi possível criar pasta no Drive');
  return created.data.id;
}
export async function writeDocumentToDrive(orgId:string,content:Buffer,name:string,mimeType:string){
  const drive=await assertPrivateRoot();
  const tenantFolder=await ensureFolder(drive,DRIVE_ROOT_ID,`org-${orgId}`);
  const docFolder=await ensureFolder(drive,tenantFolder,'documentos');
  const uploaded=await drive.files.create({requestBody:{name,parents:[docFolder]},media:{mimeType,body:Readable.from(content)},fields:'id,webViewLink'});
  if(!uploaded.data.id)throw Error('Não foi possível gravar o documento no Drive');
  return {fileId:uploaded.data.id,folderId:docFolder};
}
