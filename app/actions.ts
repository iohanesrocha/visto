'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/tenant';

const authSchema = z.object({ email:z.email().max(254), password:z.string().min(8).max(128) });

export async function signIn(formData: FormData) {
  const parsed = authSchema.safeParse({email:formData.get('email'),password:formData.get('password')});
  if (!parsed.success) redirect('/entrar?erro=campos');
  const supabase = await createClient();
  const {error} = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect('/entrar?erro=credenciais');
  redirect('/erp');
}

export async function signUp(formData: FormData) {
  const parsed = authSchema.extend({name:z.string().trim().min(2).max(120)}).safeParse({
    name:formData.get('name'),email:formData.get('email'),password:formData.get('password')
  });
  if (!parsed.success) redirect('/cadastrar?erro=campos');
  const supabase = await createClient();
  const {data,error} = await supabase.auth.signUp({
    email: parsed.data.email,password:parsed.data.password,
    options: {
      data:{full_name:parsed.data.name},
      emailRedirectTo:`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/erp`
    }
  });
  if (error) redirect('/cadastrar?erro=cadastro');
  if (data.session) redirect('/nova-empresa');
  redirect('/entrar?mensagem=confirme');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function createOrganization(formData: FormData) {
  const parsed = z.object({name:z.string().trim().min(2).max(120),document:z.string().max(30)}).safeParse({
    name:formData.get('name'),document:formData.get('document')||''
  });
  if (!parsed.success) redirect('/nova-empresa?erro=campos');
  const {supabase} = await requireUser();
  const {data,error} = await supabase.rpc('create_organization',{
    p_name:parsed.data.name,p_document:parsed.data.document||null
  });
  if (error || !data) redirect('/nova-empresa?erro=cadastro');
  redirect(`/erp/${data}`);
}
