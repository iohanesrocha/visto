import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request:Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  if (token_hash && type && ['signup','email','invite','recovery','magiclink'].includes(type)) {
    const supabase = await createClient();
    const {error} = await supabase.auth.verifyOtp({type,token_hash});
    if (!error) return NextResponse.redirect(new URL('/erp',url.origin));
  }
  return NextResponse.redirect(new URL('/entrar?erro=confirmacao',url.origin));
}
