/**
 * Pure sharing and clipboard helpers.
 */

/**
 * Builds a WhatsApp share URL with pre-filled message text.
 */
export function buildWhatsAppShareUrl(
  title: string,
  date?: string,
  location?: string,
  url?: string,
): string {
  const parts: string[] = [`🎉 Você está convidado(a) para *${title}*!`];
  if (date || location) {
    parts.push('');
    if (date) parts.push(`📅 ${date}`);
    if (location) parts.push(`📍 ${location}`);
  }
  if (url) {
    parts.push('');
    parts.push('Confirme sua presença e veja o que levar:');
    parts.push(url);
  }
  const text = parts.join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Opens WhatsApp sharing link in a new window/tab if window is available.
 */
export function shareWhatsApp(title: string, date?: string, location?: string, url?: string): void {
  if (typeof window === 'undefined') return;
  const shareUrl = buildWhatsAppShareUrl(title, date, location, url);
  window.open(shareUrl, '_blank');
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
