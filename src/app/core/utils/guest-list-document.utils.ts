import { formatDaySpan, formatTime } from './date.utils';
import type { GuestHousehold } from './guest-households.utils';
import { petsLabel } from './relationship.utils';

/** What the printed "Confirmados" list shows about the event. */
export interface GuestListDocumentEvent {
  readonly title: string;
  /** ISO start, with the time. */
  readonly date: string;
  readonly endDate?: string | null;
  readonly location: string;
}

export interface GuestListDocumentInput {
  readonly event: GuestListDocumentEvent;
  readonly households: readonly GuestHousehold[];
  /** The event has a list of items: the "O que leva" column shows. */
  readonly hasItems: boolean;
  /** When it was made, for the footer; now by default. */
  readonly generatedAt?: Date;
}

const escape = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/** "Sábado, 24 de dezembro de 2026 · 19:00" (or the span of days for a longer event). */
export function guestListWhen(event: GuestListDocumentEvent): string {
  const start = new Date(event.date);
  if (isNaN(start.getTime())) return '';
  const span = formatDaySpan(event.date, event.endDate);
  const day = span
    ? `${span} de ${start.getFullYear()}`
    : start.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
  const label = day.charAt(0).toUpperCase() + day.slice(1);
  return `${label} · ${formatTime(event.date)}`;
}

/** Everyone counted: each household's account holder plus who comes with them, pets apart. */
export function guestListPeopleCount(households: readonly GuestHousehold[]): number {
  return households.reduce(
    (total, household) => total + 1 + household.people.length - (household.pets ?? 0),
    0,
  );
}

/** The pets going, counted apart from people; "" when there are none. */
export function guestListPetsLabel(households: readonly GuestHousehold[]): string {
  const pets = households.reduce((total, household) => total + (household.pets ?? 0), 0);
  return pets ? petsLabel(pets) : '';
}

/**
 * The "Confirmados" list as a page of its own, in the app's look (lilac, Fredoka titles,
 * Plus Jakarta Sans text, the brand stripe): the event, how many families and people, then one
 * row per household with who comes along and what they bring. Printed from a frame of its own,
 * so nothing else of the page goes to paper.
 */
export function buildGuestListDocument(input: GuestListDocumentInput): string {
  const { event, households, hasItems } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const people = guestListPeopleCount(households);
  const families = households.length;
  const stamp = `${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString(
    'pt-BR',
    { hour: '2-digit', minute: '2-digit' },
  )}`;

  const rows = households
    .map((household, index) => {
      const along = household.people.length
        ? household.people.map(escape).join('<br />')
        : '<span class="none">Só a pessoa</span>';
      const bring = household.bring.length
        ? household.bring.map(escape).join('<br />')
        : '<span class="none">Nada escolhido</span>';
      return `
        <tr>
          <td class="num">${index + 1}</td>
          <td>
            <div class="name">${escape(household.name)}</div>
            ${household.phone ? `<div class="phone">${escape(household.phone)}</div>` : ''}
          </td>
          <td>${along}</td>
          ${hasItems ? `<td>${bring}</td>` : ''}
          <td class="check"><span></span></td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Confirmados · ${escape(event.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: #212529; font: 400 10.5pt/1.45 'Plus Jakarta Sans', sans-serif; }
  .stripe { height: 5px; border-radius: 3px; background: linear-gradient(90deg, #7950f2, #1c9bef 55%, #40c057); }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin: 14px 0 12px; }
  .brand { color: #7950f2; font: 600 10pt 'Fredoka', sans-serif; letter-spacing: .02em; }
  h1 { margin: 2px 0 4px; font: 600 22pt/1.15 'Fredoka', sans-serif; color: #1f1640; }
  .meta { color: #5c5f66; font-size: 10pt; }
  .meta div + div { margin-top: 1px; }
  .summary { display: flex; gap: 8px; margin: 0 0 14px; }
  .chip { background: #f1ecff; color: #5f3dc4; border-radius: 999px; padding: 4px 12px; font-weight: 600; font-size: 9.5pt; }
  .chip.green { background: #ebfbee; color: #2b8a3e; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; }
  thead th { background: #7950f2; color: #fff; text-align: left; font-weight: 600; font-size: 9pt;
    text-transform: uppercase; letter-spacing: .04em; padding: 7px 10px; }
  thead th:first-child { border-radius: 8px 0 0 8px; }
  thead th:last-child { border-radius: 0 8px 8px 0; }
  tbody td { padding: 8px 10px; vertical-align: top; border-bottom: 1px solid #ece8f7; }
  tbody tr:nth-child(even) td { background: #faf8ff; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .num { width: 28px; color: #7950f2; font-weight: 700; }
  .name { font-weight: 600; color: #1f1640; }
  .phone { color: #5c5f66; font-size: 9.5pt; }
  .none { color: #adb5bd; font-style: italic; }
  .check { width: 34px; }
  .check span { display: block; width: 14px; height: 14px; margin: 2px auto 0; border: 1.5px solid #b197fc; border-radius: 4px; }
  th.check { text-align: center; }
  footer { margin-top: 16px; color: #868e96; font-size: 8.5pt; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="stripe"></div>
  <header>
    <div>
      <div class="brand">Organiza AI · Lista de confirmados</div>
      <h1>${escape(event.title)}</h1>
      <div class="meta">
        <div>${escape(guestListWhen(event))}</div>
        ${event.location ? `<div>${escape(event.location)}</div>` : ''}
      </div>
    </div>
  </header>
  <div class="summary">
    <span class="chip">${families === 1 ? '1 família' : `${families} famílias`}</span>
    <span class="chip green">${people === 1 ? '1 pessoa' : `${people} pessoas`}</span>
    ${guestListPetsLabel(households) ? `<span class="chip">${guestListPetsLabel(households)}</span>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Quem confirmou</th>
        <th>Quem vai junto</th>
        ${hasItems ? '<th>O que leva</th>' : ''}
        <th class="check">Chegou</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>
    <span>Gerado em ${stamp}</span>
    <span>Organiza AI</span>
  </footer>
</body>
</html>`;
}
