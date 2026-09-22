// A from-scratch, dependency-free PDF writer for simple text reports --
// title/heading/text/bullet blocks laid out on A4 pages. No external PDF
// library: this runs entirely client-side, so a report never has to round
// trip through the backend just to be printable.

export type PdfTextBlock = { kind: 'title' | 'heading' | 'text' | 'bullet'; text: string };

export function formatPdfDate(value?: string | null, withTime = false) {
  if (!value) return 'Não informado';
  const parsed = withTime ? new Date(value) : new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(parsed);
}

function wrap(text: string, limit: number) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, '').split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      if (!line) line = word;
      else if (`${line} ${word}`.length <= limit) line += ` ${word}`;
      else { lines.push(line); line = word; }
    }
    lines.push(line || ' ');
  }
  return lines;
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\u0080-\uffff]/g, char => {
    const map: Record<string, number> = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 };
    const code = map[char] ?? char.charCodeAt(0);
    return code <= 255 ? `\\${code.toString(8).padStart(3, '0')}` : '?';
  });
}

export function renderPdfTextBlocks(blocks: PdfTextBlock[]): Blob {
  const pages: string[][] = [[]];
  let used = 0;
  const maxHeight = 700;
  for (const block of blocks) {
    const size = block.kind === 'title' ? 18 : block.kind === 'heading' ? 13 : 10;
    const leading = size + 5;
    const lines = wrap(`${block.kind === 'bullet' ? '• ' : ''}${block.text}`, block.kind === 'title' ? 55 : 88);
    const required = lines.length * leading + (block.kind === 'heading' ? 8 : 3);
    if (used && used + Math.min(required, leading * 2) > maxHeight) { pages.push([]); used = 0; }
    lines.forEach(line => {
      if (used + leading > maxHeight) { pages.push([]); used = 0; }
      pages.at(-1)!.push(`BT /F1 ${size} Tf 56 ${800 - used} Td (${pdfEscape(line)}) Tj ET`);
      used += leading;
    });
    used += block.kind === 'heading' ? 8 : 3;
  }
  const objects: string[] = [];
  const add = (value: string) => { objects.push(value); return objects.length; };
  const catalog = add('');
  const pagesId = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const pageIds: number[] = [];
  pages.forEach(commands => {
    const stream = commands.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n%1234\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
