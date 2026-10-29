import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Cria convites sem expor chave administrativa. Quem recebe o link deve
// entrar com o email convidado; o banco verifica email, expiração e assentos.
export async function POST(request:Request) {
  const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:'Não autenticado'},{status:401});
  let payload: unknown;
  try {payload=await request.json();} catch {return NextResponse.json({error:'JSON inválido'},{status:400});}
  const parsed = z.object({organizationId:z.uuid(),email:z.email().max(254),role:z.enum(['admin','member'])})
    .safeParse(payload);
  if(!parsed.success) return NextResponse.json({error:'Dados inválidos'},{status:400});
  const {data:membership} = await supabase.from('organization_members').select('role')
    .eq('organization_id',parsed.data.organizationId).eq('user_id',user.id).eq('status','active').maybeSingle();
  if(!membership || !['owner','admin'].includes(membership.role))
    return NextResponse.json({error:'Permissão insuficiente'},{status:403});
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const {error} = await supabase.from('invitations').insert({
    organization_id:parsed.data.organizationId,
    email:parsed.data.email.toLowerCase(),role:parsed.data.role,
    token_hash:tokenHash,
    expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(),created_by:user.id
  });
  if(error) return NextResponse.json({error:'Não foi possível gerar o convite'},{status:400});
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,'');
  if(!base) return NextResponse.json({error:'Configure NEXT_PUBLIC_APP_URL'},{status:500});
  return NextResponse.json({url:`${base}/convite/${token}`},{headers:{'Cache-Control':'no-store'}});
}
