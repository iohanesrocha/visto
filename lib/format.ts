export const money = (amount: number | null) => amount === null ? '—' :
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);
export const date = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(value));
