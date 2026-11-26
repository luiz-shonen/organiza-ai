/**
 * Checks a Firebase ID token with WebCrypto alone (no Admin SDK): RS256 signed by one of
 * Google's `securetoken` keys, for this project, not expired, not an anonymous account.
 */

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface Jwks {
  readonly keys: Map<string, JsonWebKey>;
  readonly until: number;
}

/** Google's keys, kept while this isolate lives and the `max-age` allows. */
let cached: Jwks | null = null;

export function forgetKeys(): void {
  cached = null;
}

async function signingKeys(fetcher: typeof fetch, now: number): Promise<Map<string, JsonWebKey>> {
  if (cached && cached.until > now) return cached.keys;
  const response = await fetcher(JWKS_URL);
  if (!response.ok) throw new Error(`JWKS ${response.status}`);
  const body = (await response.json()) as { keys?: (JsonWebKey & { kid?: string })[] };
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') ?? '')?.[1]);
  const keys = new Map((body.keys ?? []).map((key) => [key.kid ?? '', key] as const));
  cached = { keys, until: now + (Number.isFinite(maxAge) ? maxAge : 3600) * 1000 };
  return keys;
}

function decode(part: string): Uint8Array {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function json(part: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(decode(part))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** The account's uid, or null when the token is not a valid one for this project. */
export async function verifyIdToken(
  token: string,
  projectId: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<{ uid: string } | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = json(headerPart);
  const payload = json(payloadPart);
  if (!header || !payload || header['alg'] !== 'RS256' || typeof header['kid'] !== 'string') {
    return null;
  }

  const seconds = now / 1000;
  const firebase = payload['firebase'] as { sign_in_provider?: string } | undefined;
  if (
    payload['aud'] !== projectId ||
    payload['iss'] !== `https://securetoken.google.com/${projectId}` ||
    typeof payload['sub'] !== 'string' ||
    !payload['sub'] ||
    typeof payload['exp'] !== 'number' ||
    payload['exp'] <= seconds ||
    typeof payload['iat'] !== 'number' ||
    payload['iat'] > seconds + 300 ||
    firebase?.sign_in_provider === 'anonymous'
  ) {
    return null;
  }

  const jwk = (await signingKeys(fetcher, now)).get(header['kid']);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decode(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  );
  return valid ? { uid: payload['sub'] } : null;
}
