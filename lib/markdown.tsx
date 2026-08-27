import type { ReactNode } from 'react';

// A minimal, dependency-free renderer for the small markdown subset used by
// docs/legal/*.md (headings, blockquotes, bold/links inline, lists, and the
// one table in the privacy policy) -- not a general-purpose parser.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${index}`}>{match[1]}</strong>);
    } else {
      const href = match[3].startsWith('./') ? `/${match[3].slice(2).replace(/\.md$/, '')}` : match[3];
      nodes.push(<a key={`${keyPrefix}-${index}`} href={href}>{match[2]}</a>);
    }
    lastIndex = pattern.lastIndex;
    index += 1;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function renderMarkdown(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];
  let table: string[][] = [];
  let key = 0;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(<p key={key++}>{renderInline(paragraph.join(' '), `p${key}`)}</p>);
    paragraph = [];
  }
  function flushList() {
    if (!list.length) return;
    blocks.push(<ul key={key++}>{list.map((item, i) => <li key={i}>{renderInline(item, `li${key}-${i}`)}</li>)}</ul>);
    list = [];
  }
  function flushQuote() {
    if (!quote.length) return;
    // Soft-wrapped source lines within one `>` block belong to the same
    // paragraph; only a blank `>` line starts a new one.
    const paragraphs: string[][] = [[]];
    for (const line of quote) {
      if (!line.trim()) paragraphs.push([]);
      else paragraphs[paragraphs.length - 1].push(line);
    }
    blocks.push(<blockquote key={key++}>{paragraphs.filter((p) => p.length).map((p, i) => <p key={i}>{renderInline(p.join(' '), `q${key}-${i}`)}</p>)}</blockquote>);
    quote = [];
  }
  function flushTable() {
    if (!table.length) return;
    const [header, ...rows] = table;
    blocks.push(
      <table key={key++}>
        <thead><tr>{header.map((cell, i) => <th key={i}>{renderInline(cell, `th${key}-${i}`)}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell, `td${key}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
      </table>,
    );
    table = [];
  }
  function flushAll() { flushParagraph(); flushList(); flushQuote(); flushTable(); }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) { flushAll(); continue; }

    if (line.startsWith('# ')) { flushAll(); blocks.push(<h1 key={key++}>{renderInline(line.slice(2), `h1-${key}`)}</h1>); continue; }
    if (line.startsWith('## ')) { flushAll(); blocks.push(<h2 key={key++}>{renderInline(line.slice(3), `h2-${key}`)}</h2>); continue; }
    if (line.startsWith('### ')) { flushAll(); blocks.push(<h3 key={key++}>{renderInline(line.slice(4), `h3-${key}`)}</h3>); continue; }
    if (line.startsWith('> ')) { flushParagraph(); flushList(); flushTable(); quote.push(line.slice(2)); continue; }
    if (line.startsWith('- ')) { flushParagraph(); flushQuote(); flushTable(); list.push(line.slice(2)); continue; }
    if (line.startsWith('|')) {
      flushParagraph(); flushList(); flushQuote();
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      if (!cells.every((cell) => /^-+$/.test(cell))) table.push(cells);
      continue;
    }
    flushList(); flushQuote(); flushTable();
    paragraph.push(line);
  }
  flushAll();
  return <>{blocks}</>;
}
