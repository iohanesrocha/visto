export type FormFieldType = 'text'|'textarea'|'date'|'number'|'money'|'project'|'employee'|'work_item'|'select'|'checkbox';
export type FormField = {name:string;label:string;type:FormFieldType;required?:boolean;options?:string[];min?:number;max?:number;placeholder?:string};
export type FormSpec = {code:string;legacy:string;title:string;description:string;module:'obras'|'cadastros'|'diario-obra';table:string;managerOnly?:boolean;readOnly?:boolean;fields:FormField[];list:string[]};
const f=(name:string,label:string,type:FormFieldType,required=false,opts:Partial<FormField>={}):FormField=>({name,label,type,required,...opts});
export const FORM_CATALOG:FormSpec[] = [
 {code:'ADM-010',legacy:'Form.ADM.10',title:'Cadastro de Obras',description:'Cadastro técnico, contratual e operacional de obras e ordens de serviço.',module:'obras',table:'projects',managerOnly:true,fields:[
  f('name','Obra', 'text',true),f('code','Código da obra','text'),f('client_name','Contratante','text'),f('contract_number','Contrato','text'),
  f('description','Descrição da atividade','textarea'),f('location','Localização','text'),f('start_date','Data de início','date'),f('end_date','Previsão de término','date'),
  f('technical_manager','Responsável técnico','text'),f('art_number','ART','text'),f('service_order_number','Número da OS','text'),f('budget','Valor contratual (R$)','money')],list:['name','code','status','budget_cents','created_at']},
 {code:'ADM-006',legacy:'Form.ADM.06',title:'Cadastro de Funcionários',description:'Cadastro funcional com dados de SST. Dados pessoais são restritos a gestores.',module:'cadastros',table:'employees',managerOnly:true,fields:[
  f('employee_number','Matrícula','text',true),f('name','Nome completo','text',true),f('role_title','Função','text'),f('role_level','Nível da função','text'),
  f('cpf','CPF (restrito)','text'),f('admission_date','Admissão','date'),f('birth_date','Nascimento (restrito)','date'),f('current_project_id','Obra atual','project'),
  f('medical_exam_expires_on','Vencimento ASO','date'),f('rope_access_level','Certificação de acesso por corda','text'),f('rope_access_expires_on','Validade da certificação','date'),
  f('safety_training_expires_on','Validade treinamentos','date'),f('notes','Observações SST','textarea')],list:['employee_number','name','role_title','status','admission_date']},
 {code:'ADM-008L',legacy:'Form.Adm.08 Lista de Funcionários',title:'Lista de Funcionários',description:'Relação por matrícula, função, status e obra. Sem CPF na listagem.',module:'cadastros',table:'employees',readOnly:true,fields:[],list:['employee_number','name','role_title','status','admission_date']},
 {code:'ADM-008P',legacy:'Form.Adm.08 Perfil',title:'Perfil do Funcionário',description:'Consulta de perfis funcionais, com informações sensíveis reservadas a gestores.',module:'cadastros',table:'employees',readOnly:true,fields:[],list:['employee_number','name','role_title','status','admission_date']},
 {code:'ADM-004',legacy:'Form.ADM.04 R01',title:'Transferência de Funcionário',description:'Solicitação e aprovação de transferência entre obras, com checklist obrigatório.',module:'cadastros',table:'employee_transfers',fields:[
  f('employee_id','Funcionário','employee',true),f('from_project_id','Obra de origem','project'),f('to_project_id','Obra de destino','project',true),
  f('effective_date','Data de início','date',true),f('checklist_docs','Documentos conferidos','checkbox'),f('checklist_ppe','EPI / Kit conferidos','checkbox'),f('checklist_logistics','Logística conferida','checkbox'),f('notes','Observações','textarea')],list:['employee_id','from_project_id','to_project_id','effective_date','status']},
 {code:'OBR-000',legacy:'Novo cadastro',title:'Itens do Orçamento',description:'Cadastre itens contratuais e preços unitários antes do planejamento e da produção.',module:'obras',table:'work_items',managerOnly:true,fields:[
  f('project_id','Obra','project',true),f('item_code','Código do item','text',true),f('description','Descrição','text',true),f('unit','Unidade de medida','text',true),
  f('unit_price','Preço unitário (R$)','money',true),f('budget_quantity','Quantidade contratada','number',true)],list:['project_id','item_code','description','unit','unit_price_cents','budget_quantity']},
 {code:'OBR-001',legacy:'Form.Obr.01',title:'Diário de Obras',description:'Registro diário de atividades, efetivo, condições de tempo e ocorrências.',module:'diario-obra',table:'daily_site_reports',fields:[
  f('project_id','Obra','project',true),f('report_date','Data','date',true),f('weather','Condições climáticas','select',false,{options:['Ensolarado','Nublado','Chuvoso','Instável']}),
  f('headcount','Efetivo no dia','number'),f('activities','Atividades executadas','textarea',true),f('occurrences','Ocorrências e restrições','textarea')],list:['report_date','project_id','weather','headcount','activities']},
 {code:'OBR-002',legacy:'Form.Obr.02',title:'Serviços Realizados',description:'Medição diária de execução. O lançamento só é contabilizado após aprovação.',module:'obras',table:'production_entries',fields:[
  f('project_id','Obra','project',true),f('work_item_id','Item orçamentário','work_item',true),f('work_date','Data de execução','date',true),
  f('quantity_service','Quantidade de serviço','number'),f('quantity_supply','Quantidade de fornecimento','number'),f('note','Observação','textarea')],list:['work_date','project_id','work_item_id','quantity','amount_cents','status']},
 {code:'OBR-003',legacy:'Form.Obr.03',title:'Serviços Planejados',description:'Programação físico-financeira por item e data, preservando histórico de lançamentos.',module:'obras',table:'planning_entries',fields:[
  f('project_id','Obra','project',true),f('work_item_id','Item orçamentário','work_item',true),f('work_date','Data planejada','date',true),
  f('quantity','Quantidade planejada','number',true),f('note','Observação','textarea')],list:['work_date','project_id','work_item_id','quantity','amount_cents']},
 {code:'OBR-004',legacy:'Form.Obr.04',title:'Replanejamento',description:'Revise quantitativos e prazos sem sobrescrever o planejamento original.',module:'obras',table:'replanning_entries',managerOnly:true,fields:[
  f('project_id','Obra','project',true),f('work_item_id','Item orçamentário','work_item',true),f('start_date','Início','date',true),f('end_date','Término','date',true),
  f('include_saturday','Considerar sábados','checkbox'),f('include_sunday','Considerar domingos','checkbox'),f('revised_quantity','Quantidade replanejada','number',true),f('reason','Justificativa','textarea',true)],list:['start_date','end_date','project_id','work_item_id','revised_quantity','revised_amount_cents']},
 {code:'OBR-005',legacy:'Form.Obr.05',title:'Controle Executivo de Metas',description:'Metas por competência, com rastreabilidade de responsáveis e valores.',module:'obras',table:'monthly_targets',managerOnly:true,fields:[
  f('project_id','Obra','project',true),f('month','Competência (primeiro dia do mês)','date',true),f('target_amount','Meta mensal (R$)','money',true)],list:['month','project_id','target_cents','updated_at']}
];
export const getForm=(code:string)=>FORM_CATALOG.find(x=>x.code===code);
