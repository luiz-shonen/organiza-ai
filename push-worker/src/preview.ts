/**
 * "Prévia do link": what a gift idea's link leads to (title, picture, price, the real site after
 * redirects) and whether Google Safe Browsing lists it as dangerous. Read like WhatsApp does,
 * from the page's Open Graph tags; nothing is run, only the first part of the HTML is read.
 */

export interface LinkPreview {
  /** The address as typed. */
  readonly url: string;
  /** Where it really leads, after redirects (a bit.ly shows the real store here). */
  readonly finalUrl: string;
  readonly host: string;
  readonly title: string;
  readonly description: string;
  /** https picture of the product, or ''. */
  readonly image: string;
  readonly siteName: string;
  /** "R$ 89,90" when the page says it; '' otherwise. */
  readonly price: string;
  /** true: Google lists it as dangerous; false: not listed; null: could not check. */
  readonly dangerous: boolean | null;
  /** The page could not be read (blocked, offline): only the address is known. */
  readonly unreadable: boolean;
}

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;
export const PREVIEW_CACHE_SECONDS = 24 * 60 * 60;

/** A web address that may be fetched: http(s), a public name, no IP literal, no odd port. */
export function isFetchable(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== '80' && url.port !== '443') return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal')) return null;
  if (host === 'localhost' || host.endsWith('.localhost')) return null;
  // IPv4 or IPv6 literals: never, so the Worker cannot be pointed at a private address.
  if (/^[\d.]+$/.test(host) || host.startsWith('[')) return null;
  return url;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function clean(text: string, max: number): string {
  return decodeEntities(text).replace(/\s+/g, ' ').trim().slice(0, max);
}

/** `<meta property|name="key" content="…">`, in either attribute order. */
function meta(html: string, keys: readonly string[]): string {
  for (const key of keys) {
    const k = key.replace(/[.:]/g, '\\$&');
    const a = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)\\s*=\\s*["']${k}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      'i',
    ).exec(html);
    if (a?.[1]) return a[1];
    const b = new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name|itemprop)\\s*=\\s*["']${k}["']`,
      'i',
    ).exec(html);
    if (b?.[1]) return b[1];
  }
  return '';
}

function formatPrice(amount: string, currency: string): string {
  const value = Number(amount.replace(',', '.'));
  if (!amount || !Number.isFinite(value) || value <= 0) return '';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: (currency || 'BRL').toUpperCase(),
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}

/** Title, description, picture and price from the page's head. */
export function readPage(
  html: string,
  pageUrl: URL,
): Pick<LinkPreview, 'title' | 'description' | 'image' | 'siteName' | 'price'> {
  const title =
    meta(html, ['og:title', 'twitter:title']) ||
    (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '');
  let image = meta(html, ['og:image:secure_url', 'og:image', 'twitter:image']);
  try {
    image = image ? new URL(decodeEntities(image), pageUrl).href : '';
  } catch {
    image = '';
  }
  return {
    title: clean(title, 200),
    description: clean(meta(html, ['og:description', 'description', 'twitter:description']), 300),
    // Only a secure picture is shown in the app.
    image: image.startsWith('https://') ? image.slice(0, 1000) : '',
    siteName: clean(meta(html, ['og:site_name']), 80),
    price: formatPrice(
      meta(html, ['product:price:amount', 'og:price:amount', 'price']),
      meta(html, ['product:price:currency', 'og:price:currency', 'priceCurrency']),
    ),
  };
}

/** The first part of a response body, as text. */
async function readHead(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  const all = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    all.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder().decode(all.slice(0, MAX_HTML_BYTES));
}

/** Follows redirects one by one, checking each hop, and reads the page it lands on. */
async function fetchPage(
  start: URL,
  fetcher: typeof fetch,
): Promise<{ finalUrl: URL; html: string } | { finalUrl: URL; html: null }> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetcher(current.href, {
      redirect: 'manual',
      headers: {
        // Many stores only answer link previews to crawlers they know.
        'user-agent':
          'Mozilla/5.0 (compatible; OrganizaAI-LinkPreview/1.0; +https://organizaai.web.app)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => null);
    if (!response) return { finalUrl: current, html: null };
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = isFetchable(new URL(location, current).href);
      await response.body?.cancel().catch(() => undefined);
      if (!next) return { finalUrl: current, html: null };
      current = next;
      continue;
    }
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !type.includes('html')) {
      await response.body?.cancel().catch(() => undefined);
      return { finalUrl: current, html: null };
    }
    return { finalUrl: current, html: await readHead(response) };
  }
  return { finalUrl: current, html: null };
}

/** Google Safe Browsing: is any of these addresses a known scam or malware site? */
export async function isDangerous(
  urls: readonly string[],
  apiKey: string | undefined,
  fetcher: typeof fetch,
): Promise<boolean | null> {
  if (!apiKey) return null;
  const response = await fetcher(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'organizaai', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [...new Set(urls)].map((url) => ({ url })),
        },
      }),
    },
  ).catch(() => null);
  if (!response?.ok) return null;
  const body = (await response.json().catch(() => null)) as { matches?: unknown[] } | null;
  if (!body) return null;
  return (body.matches?.length ?? 0) > 0;
}

/** The preview of a link; null when it is not a web address that may be fetched. */
export async function previewLink(
  raw: string,
  safeBrowsingKey: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<LinkPreview | null> {
  const start = isFetchable(raw);
  if (!start) return null;
  const { finalUrl, html } = await fetchPage(start, fetcher);
  const page = html
    ? readPage(html, finalUrl)
    : { title: '', description: '', image: '', siteName: '', price: '' };
  const dangerous = await isDangerous([start.href, finalUrl.href], safeBrowsingKey, fetcher);
  return {
    url: start.href,
    finalUrl: finalUrl.href,
    host: finalUrl.hostname.replace(/^www\./, ''),
    ...page,
    dangerous,
    unreadable: html === null,
  };
}
