/** A piece of free text: plain words, or a web link found in them. */
export interface TextPart {
  readonly text: string;
  /** The address to open (always http or https); missing for plain words. */
  readonly url?: string;
}

/** `https://…`, `http://…` or `www.…`, up to the next space. */
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
/** Punctuation that ends a sentence, not the link ("veja https://x.com/a."). */
const TRAILING = /[.,;:!?)\]}]+$/;

/** Addresses that hide where they lead: the person cannot tell the real site before opening. */
const SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'cutt.ly',
  'is.gd',
  'goo.gl',
  'ow.ly',
  't.co',
  'encurtador.com.br',
  'shorturl.at',
  'rebrand.ly',
];

/** Splits free text (a gift idea) into words and the links in it, in order. */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const raw = match[0].replace(TRAILING, '');
    const url = toWebUrl(raw);
    if (!url) continue;
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: raw, url });
    last = start + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** The address as a full http(s) URL, or null when it is not a web address. */
export function toWebUrl(raw: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/** The site a link opens ("a.aliexpress.com"), as the person should check it. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** A short link (bit.ly…) that hides the real site. */
export function isShortenedLink(url: string): boolean {
  const host = linkHost(url).toLowerCase();
  return SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`));
}
