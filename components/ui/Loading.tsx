import { SkeletonBlock } from './Skeleton';

export function ContentLoading({ label = 'Carregando conteúdo...' }: { label?: string }) {
  return <section className="content-loading" aria-busy="true" aria-live="polite"><span className="spinner" aria-hidden="true" /><span>{label}</span></section>;
}

export function CardSkeleton() {
  return <article className="card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock className="sk-action" /></article>;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="card">{Array.from({ length: rows }, (_, index) => <div className="list-row" key={index}><SkeletonBlock /><SkeletonBlock className="sk-action" /></div>)}</div>;
}

export function TableSkeleton({ rows = 5, columns = 3 }: { rows?: number; columns?: number }) {
  return <div className="table-wrap"><table><tbody>{Array.from({ length: rows }, (_, row) => <tr key={row}>{Array.from({ length: columns }, (_, column) => <td key={column}><SkeletonBlock /></td>)}</tr>)}</tbody></table></div>;
}
