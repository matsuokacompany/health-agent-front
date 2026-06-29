import Link from 'next/link';
export default function Forbidden(){return <main><section className="panel"><span className="badge risk-alto">Acesso negado</span><h1 className="danger">Acesso negado</h1><p className="muted">Você não tem permissão para acessar este recurso ou vínculo clínico.</p><Link className="button" href="/login">Voltar ao login</Link></section></main>}
