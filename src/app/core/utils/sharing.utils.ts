/**
 * Pure sharing and clipboard helpers.
 */
import { formatDaySpan } from './date.utils';

export interface EventShare {
  readonly title: string;
  /** ISO date and time of the event. */
  readonly date?: string | null;
  /** Last day ("2026-12-25") of an event that runs over several days. */
  readonly endDate?: string | null;
  readonly location?: string | null;
  readonly url?: string | null;
}

/**
 * "terça-feira, 10 de novembro · 19:30", as the event page shows it ("23 a 25 de dezembro ·
 * 17:00" over several days); '' when the date is missing or not a date.
 */
export function formatShareDate(iso: string | null | undefined, endDay?: string | null): string {
  const date = new Date(iso ?? '');
  if (!iso || isNaN(date.getTime())) return '';
  const day =
    formatDaySpan(iso, endDay) ||
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

/**
 * The invitation text: the title in bold, when and where, and the link alone on the last
 * line, so WhatsApp turns all of it into one link and nothing follows it.
 *
 * No emoji on purpose: WhatsApp's share page (wa.me and api.whatsapp.com alike) turns
 * every character beyond U+07FF into "�" on the way to the app, emoji included, and the
 * extra characters then shift where it thinks the link starts and ends.
 */
export function buildShareMessage({ title, date, endDate, location, url }: EventShare): string {
  const lines = [`*${title.trim() || 'Nosso evento'}*`, 'Você está convidado(a)!'];
  const when = formatShareDate(date, endDate);
  if (when || location) {
    lines.push('');
    if (when) lines.push(`*Quando:* ${when}`);
    if (location) lines.push(`*Onde:* ${location}`);
  }
  if (url) {
    lines.push('', 'Confirme sua presença e veja o que levar:', url);
  }
  return lines.join('\n');
}

/** WhatsApp share link (api.whatsapp.com directly, skipping the wa.me redirect). */
export function buildWhatsAppShareUrl(share: EventShare): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareMessage(share))}`;
}

/** Opens the WhatsApp share in a new tab. */
export function shareWhatsApp(share: EventShare): void {
  if (typeof window === 'undefined') return;
  window.open(buildWhatsAppShareUrl(share), '_blank', 'noopener,noreferrer');
}

/**
 * Copies text to the system clipboard using navigator.clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand below
    }
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
