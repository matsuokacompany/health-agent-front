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

// Brand identity for printable/downloadable documents: a colored letterhead
// band with the platform wordmark on every page, and a footer with page
// numbers -- the only branding this from-scratch PDF writer can carry
// without image/XObject support (see file header), done entirely with plain
// content-stream fill/stroke operators.
const BRAND_FILL = '0.310 0.275 0.898'; // #4f46e5
const FOOTER_INK = '0.420 0.447 0.565'; // #6b7290
const FOOTER_LINE = '0.788 0.812 0.918'; // #c9cfea
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HEADER_HEIGHT = 54;
const CONTENT_TOP = 764;
const CONTENT_MAX_HEIGHT = 674;
const MARGIN_X = 56;

function headerCommands() {
  return [
    `${BRAND_FILL} rg 0 ${PAGE_HEIGHT - HEADER_HEIGHT} ${PAGE_WIDTH} ${HEADER_HEIGHT} re f`,
    `1 1 1 rg BT /F2 18 Tf ${MARGIN_X} 813 Td (${pdfEscape('Julha')}) Tj ET`,
    `1 1 1 rg BT /F1 8 Tf ${MARGIN_X} 799 Td (${pdfEscape('Acompanhamento clínico contínuo')}) Tj ET`,
  ];
}

function footerCommands(pageNumber: number, totalPages: number) {
  const label = `Página ${pageNumber} de ${totalPages}`;
  const rightX = PAGE_WIDTH - MARGIN_X - label.length * 4.3;
  return [
    `${FOOTER_LINE} RG ${MARGIN_X} 54 m ${PAGE_WIDTH - MARGIN_X} 54 l S`,
    `${FOOTER_INK} rg BT /F1 8 Tf ${MARGIN_X} 40 Td (${pdfEscape('Julha - plataforma de acompanhamento clinico')}) Tj ET`,
    `${FOOTER_INK} rg BT /F1 8 Tf ${rightX} 40 Td (${pdfEscape(label)}) Tj ET`,
  ];
}

export function renderPdfTextBlocks(blocks: PdfTextBlock[]): Blob {
  const pages: string[][] = [[]];
  let used = 0;
  const maxHeight = CONTENT_MAX_HEIGHT;
  for (const block of blocks) {
    const size = block.kind === 'title' ? 18 : block.kind === 'heading' ? 13 : 10;
    const leading = size + 5;
    const font = block.kind === 'title' || block.kind === 'heading' ? 'F2' : 'F1';
    const color = block.kind === 'heading' ? BRAND_FILL : '0 0 0';
    const lines = wrap(`${block.kind === 'bullet' ? '• ' : ''}${block.text}`, block.kind === 'title' ? 55 : 88);
    const required = lines.length * leading + (block.kind === 'heading' ? 8 : 3);
    if (used && used + Math.min(required, leading * 2) > maxHeight) { pages.push([]); used = 0; }
    lines.forEach(line => {
      if (used + leading > maxHeight) { pages.push([]); used = 0; }
      pages.at(-1)!.push(`${color} rg BT /${font} ${size} Tf ${MARGIN_X} ${CONTENT_TOP - used} Td (${pdfEscape(line)}) Tj ET`);
      used += leading;
    });
    used += block.kind === 'heading' ? 8 : 3;
  }
  const objects: string[] = [];
  const add = (value: string) => { objects.push(value); return objects.length; };
  const catalog = add('');
  const pagesId = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds: number[] = [];
  pages.forEach((commands, index) => {
    const stream = [...headerCommands(), ...commands, ...footerCommands(index + 1, pages.length)].join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${font} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${content} 0 R >>`));
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
