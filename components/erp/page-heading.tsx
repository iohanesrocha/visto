import type {ReactNode} from 'react';
export function PageHeading({title,description,eyebrow,actions}:{title:string;description?:string;eyebrow?:string;actions?:ReactNode}){
  return <div className="visto-pageheading"><div><div className="visto-page-eyebrow">{eyebrow||'VISTO ERP'}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="visto-page-actions">{actions}</div>}</div>;
}
export function ModuleNotice(){return <p className="visto-beta"><strong>Versão de implantação:</strong> este módulo oferece registro e consulta básicos. Fluxos legais, contábeis, fiscais, automações e integrações dependem de desenvolvimento e homologação específicos.</p>}
