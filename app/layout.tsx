import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Visto ERP | Gestão empresarial modular',description:'ERP SaaS multiempresa, com módulos, usuários e permissões.'};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="pt-BR"><body>{children}</body></html>;
}
