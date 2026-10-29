import {CalendarDays,ReceiptText,ShieldCheck} from 'lucide-react';
import {requireOrganization,canManage} from '@/lib/tenant';
import {date} from '@/lib/format';
export default async function Billing({params}:{params:Promise<{organizationId:string}>}) {
  const {organizationId}=await params;
  const {supabase,role}=await requireOrganization(organizationId);
  if(!canManage(role)) return <div className="panel panel-pad"><h1 className="page-title">Assinatura</h1><p className="note note-error">Somente administradores podem visualizar esta seção.</p></div>;
  const {data:subs}=await supabase.from('subscriptions').select('plan_id,status,current_period_end,plans(name,max_users)')
    .eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(1);
  const subscription=subs?.[0];const plan=subscription?.plans as unknown as {name:string;max_users:number}|null;
  const days=subscription?Math.max(0,Math.ceil((new Date(subscription.current_period_end).getTime()-Date.now())/86400000)):0;
  return <><div className="eyebrow">CONTA E PAGAMENTO</div><h1 className="page-title">Assinatura</h1><p className="muted small">Consulte sua licença. A cobrança automática será integrada posteriormente.</p>
    <div className="grid two-col space-top"><section className="panel panel-pad"><ReceiptText size={28} color="#1b69cd"/><h2>{plan?.name??'Sem plano'}</h2><span className="pill">{subscription?.status==='trialing'?'Avaliação gratuita':subscription?.status==='active'?'Ativa':'Inativa'}</span><div className="rule"/>
      <div className="list-row"><span className="small muted">Usuários permitidos</span><b>{plan?.max_users??'—'}</b></div>
      <div className="list-row"><span className="small muted">Vencimento</span><b>{subscription?date(subscription.current_period_end):'—'}</b></div>
      <div className="list-row"><span className="small muted">Dias restantes</span><b>{days}</b></div>
    </section><section className="panel panel-pad"><ShieldCheck size={28} color="#187f61"/><h2 className="subheading" style={{marginTop:15}}>Licenciamento por empresa</h2><p className="small muted">O banco verifica se existe assinatura vigente e se o módulo está incluído no plano, antes de liberar o acesso aos dados operacionais.</p><div className="note"><CalendarDays size={16} style={{verticalAlign:'-3px',marginRight:8}}/>Avaliação de até 14 dias por ambiente.</div></section></div>
    <div className="billing-warning space-top"><b>Integração comercial pendente.</b> Não existe processamento de pagamento ou renovação automática nesta entrega. Os planos pagos são apenas registros de catálogo. Não anuncie a cobrança como ativa antes da integração de gateway, webhooks e emissão fiscal.</div>
  </>;
}
