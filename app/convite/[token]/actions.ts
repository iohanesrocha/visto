'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/tenant';

export async function acceptInvite(formData:FormData) {
  const token = formData.get('token');
  if(typeof token !== 'string'||token.length<32||token.length>256) redirect('/erp?erro=convite');
  const {supabase} = await requireUser();
  const {data,error} = await supabase.rpc('accept_invitation',{p_token:token});
  if(error || !data) redirect('/erp?erro=convite');
  redirect(`/erp/${data}`);
}
