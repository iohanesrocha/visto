import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ShieldCheck,UserRound} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
export default async function EmployeeProfile({params}:{params:Promise<{organizationId:string;employeeId:string}>}){
 const {organizationId,employeeId}=await params;
 const {supabase,role}=await requireOrganization(organizationId);
 const {data:person}=await supabase.from('employees').select('id,employee_number,name,role_title,role_level,admission_date,current_project_id,status').eq('id',employeeId).eq('organization_id',organizationId).maybeSingle();
 if(!person)notFound();
 const sensitive=canManage(role)?await supabase.rpc('get_employee_sensitive',{p_employee_id:employeeId}):null;
 const details=(sensitive?.data?.[0]||null) as null|{cpf?:string;birth_date?:string;medical_exam_expires_on?:string;rope_access_level?:string;rope_access_expires_on?:string;safety_training_expires_on?:string;notes?:string};
 const fields:[string,unknown][]=[['Matrícula',person.employee_number],['Nome',person.name],['Função',person.role_title],['Nível',person.role_level],['Admissão',person.admission_date],['Situação',person.status]];
 return <><Link href={`/erp/${organizationId}/formularios/ADM-008P`} className="muted small">← Lista de perfis</Link>
 <div className="eyebrow" style={{marginTop:20}}>ADMINISTRAÇÃO / ADM-008P</div><h1 className="page-title"><UserRound size={21}/> Perfil de Funcionário</h1>
 <section className="panel panel-pad space-top"><h2 className="subheading">Identificação funcional</h2><div className="visto-form-grid">{fields.map(([k,v])=><div className="visto-profile-attr" key={k}><span>{k}</span><b>{v?String(v):'—'}</b></div>)}</div></section>
 {canManage(role)?<section className="panel panel-pad space-top"><h2 className="subheading"><ShieldCheck size={16}/> Informações de acesso restrito</h2><div className="visto-form-grid">{[
 ['CPF',details?.cpf],['Nascimento',details?.birth_date],['Vencimento ASO',details?.medical_exam_expires_on],
 ['Certificação por corda',details?.rope_access_level],['Validade da certificação',details?.rope_access_expires_on],
 ['Validade dos treinamentos',details?.safety_training_expires_on],['Observações',details?.notes]
 ].map(([k,v])=><div className="visto-profile-attr" key={k||''}><span>{k}</span><b>{v||'—'}</b></div>)}</div></section>:<p className="note">Informações pessoais e de SST ficam disponíveis somente para administradores da empresa.</p>}
 </>;
}
