import { jsPDF } from 'jspdf';
import {
  guestListPeopleCount,
  guestListWhen,
  type GuestListDocumentInput,
} from '../../core/utils/guest-list-document.utils';

/**
 * The "Confirmados" list as a PDF, drawn in the same look as the printed page (the brand
 * stripe, lilac header row, light zebra rows, a "Chegou" box per family). Loaded only when
 * someone presses "Baixar", so jsPDF never weighs on the page itself.
 */

type Rgb = readonly [number, number, number];

const PRIMARY: Rgb = [121, 80, 242];
const ON_PRIMARY_CONTAINER: Rgb = [95, 61, 196];
const PRIMARY_CONTAINER: Rgb = [241, 236, 255];
const GREEN_CONTAINER: Rgb = [235, 251, 238];
const ON_GREEN_CONTAINER: Rgb = [43, 138, 62];
const INK: Rgb = [31, 22, 64];
const TEXT: Rgb = [33, 37, 41];
const MUTED: Rgb = [92, 95, 102];
const FAINT: Rgb = [173, 181, 189];
const ZEBRA: Rgb = [250, 248, 255];
const RULE: Rgb = [236, 232, 247];
const CHECK: Rgb = [177, 151, 252];
/** The brand stripe: lilac, sky blue, leaf green. */
const STRIPE: readonly Rgb[] = [
  [121, 80, 242],
  [28, 155, 239],
  [64, 192, 87],
];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const BOTTOM = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
/** Millimetres per line of 10pt text. */
const LINE = 4.6;
const PAD = 2.8;

const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as unknown as Rgb;

function stripe(doc: jsPDF, y: number): void {
  const steps = 90;
  const width = CONTENT_W / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const color =
      t < 0.55 ? mix(STRIPE[0], STRIPE[1], t / 0.55) : mix(STRIPE[1], STRIPE[2], (t - 0.55) / 0.45);
    doc.setFillColor(...color);
    doc.rect(MARGIN + i * width, y, width + 0.2, 1.6, 'F');
  }
}

function chip(doc: jsPDF, x: number, y: number, text: string, fill: Rgb, ink: Rgb): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const w = doc.getTextWidth(text) + 7;
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, 6.4, 3.2, 3.2, 'F');
  doc.setTextColor(...ink);
  doc.text(text, x + 3.5, y + 4.35);
  return w;
}

/** A file name from the event title: "confirmados-natal-2026-da-familia.pdf". */
export function guestListPdfName(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `confirmados-${slug || 'evento'}.pdf`;
}

export function buildGuestListPdf(input: GuestListDocumentInput): jsPDF {
  const { event, households, hasItems } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title: `Confirmados · ${event.title}`, creator: 'Organiza AI' });

  // Columns: #, who confirmed, who comes along, what they bring (when there are items), arrived.
  const numW = 8;
  const checkW = 14;
  const rest = CONTENT_W - numW - checkW;
  const cols = hasItems
    ? [
        { title: '#', w: numW },
        { title: 'QUEM CONFIRMOU', w: rest * 0.38 },
        { title: 'QUEM VAI JUNTO', w: rest * 0.3 },
        { title: 'O QUE LEVA', w: rest * 0.32 },
        { title: 'CHEGOU', w: checkW },
      ]
    : [
        { title: '#', w: numW },
        { title: 'QUEM CONFIRMOU', w: rest * 0.55 },
        { title: 'QUEM VAI JUNTO', w: rest * 0.45 },
        { title: 'CHEGOU', w: checkW },
      ];
  const colX = cols.map((_, i) => MARGIN + cols.slice(0, i).reduce((sum, c) => sum + c.w, 0));

  // Header of the first page: the event.
  let y = MARGIN;
  stripe(doc, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text('Organiza AI · Lista de confirmados', MARGIN, y);
  y += 8;
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(event.title, CONTENT_W) as string[];
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const meta = [guestListWhen(event), event.location].filter(Boolean);
  for (const line of meta.flatMap((text) => doc.splitTextToSize(text, CONTENT_W) as string[])) {
    doc.text(line, MARGIN, y);
    y += LINE;
  }
  y += 2;
  const families = households.length;
  const people = guestListPeopleCount(households);
  const first = chip(
    doc,
    MARGIN,
    y,
    families === 1 ? '1 família' : `${families} famílias`,
    PRIMARY_CONTAINER,
    ON_PRIMARY_CONTAINER,
  );
  chip(
    doc,
    MARGIN + first + 3,
    y,
    people === 1 ? '1 pessoa' : `${people} pessoas`,
    GREEN_CONTAINER,
    ON_GREEN_CONTAINER,
  );
  y += 11;

  const headerRow = () => {
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    cols.forEach((col, i) => {
      const last = i === cols.length - 1;
      const x = last ? colX[i] + col.w / 2 : colX[i] + PAD;
      doc.text(col.title, x, y + 5.3, last ? { align: 'center' } : undefined);
    });
    y += 8;
  };
  headerRow();

  households.forEach((household, index) => {
    const cellW = (i: number) => cols[i].w - PAD * 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const name = doc.splitTextToSize(household.name, cellW(1)) as string[];
    doc.setFont('helvetica', 'normal');
    const phone = household.phone
      ? (doc.splitTextToSize(household.phone, cellW(1)) as string[])
      : [];
    const along = household.people.length
      ? household.people.flatMap((p) => doc.splitTextToSize(p, cellW(2)) as string[])
      : [];
    const bring = hasItems
      ? household.bring.flatMap((b) => doc.splitTextToSize(b, cellW(3)) as string[])
      : [];
    const lines = Math.max(name.length + phone.length, along.length || 1, bring.length || 1);
    const rowH = lines * LINE + PAD * 2;

    // A new page repeats the header row; a row is never split between pages.
    if (y + rowH > PAGE_H - BOTTOM) {
      doc.addPage();
      y = MARGIN;
      headerRow();
    }

    if (index % 2 === 1) {
      doc.setFillColor(...ZEBRA);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH);

    const top = y + PAD + 3.4;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text(String(index + 1), colX[0] + PAD, top);

    doc.setTextColor(...INK);
    doc.text(name, colX[1] + PAD, top, { lineHeightFactor: 1.3 });
    if (phone.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(phone, colX[1] + PAD, top + name.length * LINE);
      doc.setFontSize(10);
    }

    const cell = (i: number, text: string[], empty: string) => {
      doc.setFont('helvetica', text.length ? 'normal' : 'italic');
      doc.setTextColor(...(text.length ? TEXT : FAINT));
      doc.text(text.length ? text : [empty], colX[i] + PAD, top, { lineHeightFactor: 1.3 });
    };
    cell(2, along, 'Só a pessoa');
    if (hasItems) cell(3, bring, 'Nada escolhido');

    const box = 3.8;
    const checkCol = cols.length - 1;
    doc.setDrawColor(...CHECK);
    doc.setLineWidth(0.45);
    doc.roundedRect(
      colX[checkCol] + (cols[checkCol].w - box) / 2,
      y + PAD + 0.6,
      box,
      box,
      1,
      1,
      'S',
    );

    y += rowH;
  });

  // Footer on every page: when it was made, and the page.
  const stamp = `Gerado em ${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString(
    'pt-BR',
    { hour: '2-digit', minute: '2-digit' },
  )}`;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(134, 142, 150);
    doc.text(stamp, MARGIN, PAGE_H - 8);
    doc.text(`Organiza AI · página ${page} de ${pages}`, PAGE_W - MARGIN, PAGE_H - 8, {
      align: 'right',
    });
  }
  return doc;
}
