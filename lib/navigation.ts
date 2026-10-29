/** Menus centrais do Visto ERP. Slugs usados também nas permissões do Supabase. */
export type NavItem = {label:string;screen:string;description?:string;formCode?:string;shortcut?:'dashboard'|'obras'|'usuarios'|'modulos'|'assinatura'|'empresas'|'auditoria'|'painel-obras'|'arquivos'};
export type NavGroup = {slug:string;label:string;icon:string;items:NavItem[]};
export const NAVIGATION:NavGroup[] = [
  {slug:'gerencial',label:'Gerencial',icon:'layout-dashboard',items:[
    {label:'Dash Gerencial',screen:'dashboard',shortcut:'dashboard'},
    {label:'Central de Aprovações',screen:'aprovacoes'},
    {label:'Documentos (GED)',screen:'documentos'},
    {label:'Arquivos Google Drive',screen:'arquivos',shortcut:'arquivos'}]},
  {slug:'administracao',label:'Administração',icon:'shield',items:[
    {label:'Empresas',screen:'empresas',shortcut:'empresas'},
    {label:'Usuários e Convites',screen:'usuarios',shortcut:'usuarios'},
    {label:'Módulos contratados',screen:'modulos',shortcut:'modulos'},
    {label:'Plano e Assinatura',screen:'assinatura',shortcut:'assinatura'},
    {label:'Auditoria',screen:'auditoria',shortcut:'auditoria'}]},
  {slug:'cadastros',label:'Cadastros',icon:'tags',items:[
    {label:'Clientes',screen:'clientes'}, {label:'Fornecedores',screen:'fornecedores'},
    {label:'Centros de Custo',screen:'centros-de-custo'},
    {label:'Colaboradores',screen:'colaboradores'},
    {label:'Obras',screen:'obras',shortcut:'obras'},
    {label:'Cadastro de Obras • ADM-010',screen:'cadastro-obras',formCode:'ADM-010'},
    {label:'Cadastro de Funcionários • ADM-006',screen:'funcionarios',formCode:'ADM-006'},
    {label:'Lista de Funcionários • ADM-008L',screen:'lista-funcionarios',formCode:'ADM-008L'},
    {label:'Perfil de Funcionários • ADM-008P',screen:'perfil-funcionarios',formCode:'ADM-008P'},
    {label:'Transferências • ADM-004',screen:'transferencia',formCode:'ADM-004'}]},
  {slug:'financeiro',label:'Financeiro',icon:'wallet',items:[
    {label:'Contas a Pagar',screen:'contas-a-pagar'},
    {label:'Contas a Receber',screen:'contas-a-receber'},
    {label:'Fluxo de Caixa',screen:'fluxo-de-caixa'},
    {label:'Caixa e Bancos',screen:'caixa-e-bancos'},
    {label:'Lançamentos Financeiros',screen:'lancamentos'}]},
  {slug:'suprimentos',label:'Suprimentos',icon:'shopping-cart',items:[
    {label:'Solicitações',screen:'solicitacoes'}, {label:'Cotações',screen:'cotacoes'},
    {label:'Pedidos de Compra',screen:'pedidos'}, {label:'Estoque',screen:'estoque'}]},
  {slug:'fiscal',label:'Fiscal',icon:'file-text',items:[
    {label:'Notas de Entrada',screen:'notas-entrada'}, {label:'Notas de Saída',screen:'notas-saida'}]},
  {slug:'patrimonio',label:'Patrimônio',icon:'warehouse',items:[
    {label:'Bens Patrimoniais',screen:'bens'}, {label:'Inventário',screen:'inventario'}]},
  {slug:'frota',label:'Frota',icon:'truck',items:[
    {label:'Veículos',screen:'veiculos'}, {label:'Abastecimentos',screen:'abastecimentos'},
    {label:'Manutenções',screen:'manutencoes'}]},
  {slug:'diario-obra',label:'Diário de Obra',icon:'clipboard-list',items:[
    {label:'Diário • OBR-001',screen:'diario-obra',formCode:'OBR-001'},
    {label:'Itens de Orçamento',screen:'itens-orcamento',formCode:'OBR-000'},
    {label:'Planejado • OBR-003',screen:'planejado',formCode:'OBR-003'},
    {label:'Realizado • OBR-002',screen:'realizado',formCode:'OBR-002'},
    {label:'Replanejado • OBR-004',screen:'replanejado',formCode:'OBR-004'},
    {label:'Metas • OBR-005',screen:'metas',formCode:'OBR-005'},
    {label:'Painel de Obras',screen:'painel-obras',shortcut:'painel-obras'},
    {label:'Ocorrências',screen:'ocorrencias'}]},
  {slug:'alojamentos',label:'Alojamentos',icon:'bed-double',items:[
    {label:'Unidades',screen:'unidades'}, {label:'Ocupações',screen:'ocupacoes'}]},
  {slug:'contabilidade',label:'Contabilidade',icon:'layers',items:[
    {label:'Lançamentos Contábeis',screen:'lancamentos'},
    {label:'Plano de Contas',screen:'plano-de-contas'}, {label:'Livro Razão',screen:'razao'}]},
  {slug:'qsms',label:'QSMS / SST',icon:'hard-hat',items:[
    {label:'Inspeções',screen:'inspecoes'}, {label:'Não Conformidades',screen:'nao-conformidades'},
    {label:'Treinamentos',screen:'treinamentos'}]},
];

export function getItem(group:string,screen:string) {
  const g=NAVIGATION.find(g=>g.slug===group);
  const item=g?.items.find(i=>i.screen===screen);
  return g && item ? {group:g,item} : null;
}
export function navHref(orgId:string,group:string,item:NavItem) {
  const base=`/erp/${orgId}`;
  const shortcuts:Record<NonNullable<NavItem['shortcut']>,string>={
    dashboard:base,obras:`${base}/obras`,usuarios:`${base}/usuarios`,
    modulos:`${base}/modulos`,assinatura:`${base}/assinatura`,empresas:'/erp',auditoria:`${base}/auditoria`
  };
  return item.formCode?`${base}/formularios/${item.formCode}`:item.shortcut?shortcuts[item.shortcut]:`${base}/operacional/${group}/${item.screen}`;
}
