/**
 * Firestore over REST with the caller's own ID token: every read and write passes the
 * security rules exactly as if the app had made it.
 */

type Value =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: Value[] } }
  | { mapValue: { fields?: Record<string, Value> } };

export interface StoredDoc {
  readonly data: Record<string, unknown>;
  /** For a write that must find the document as it was read (`currentDocument`). */
  readonly updateTime: string;
}

function plain(value: Value): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(plain);
  if ('mapValue' in value) return plainFields(value.mapValue.fields ?? {});
  return null;
}

function plainFields(fields: Record<string, Value>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, plain(value)]));
}

/** A plain value as Firestore's REST type: strings, whole numbers, lists and maps. */
export function toValue(value: unknown): Value {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (value && typeof value === 'object') {
    return { mapValue: { fields: toFields(value as Record<string, unknown>) } };
  }
  return { nullValue: null };
}

export function toFields(data: Record<string, unknown>): Record<string, Value> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));
}

export class Firestore {
  constructor(
    private readonly projectId: string,
    private readonly idToken: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  /** `projects/…/documents/events/abc`, as a write names a document. */
  name(path: string): string {
    return `projects/${this.projectId}/databases/(default)/documents/${path}`;
  }

  private url(suffix: string): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents${suffix}`;
  }

  /** The document, null when it does not exist; throws when the rules refuse it. */
  async get(path: string): Promise<StoredDoc | null> {
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const response = await this.fetcher(this.url(`/${encoded}`), {
      headers: { authorization: `Bearer ${this.idToken}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`read ${path}: HTTP ${response.status}`);
    const body = (await response.json()) as { fields?: Record<string, Value>; updateTime: string };
    return { data: plainFields(body.fields ?? {}), updateTime: body.updateTime };
  }

  /** All writes at once, or none: the HTTP status of the answer (200 when it went through). */
  async commit(writes: readonly unknown[]): Promise<number> {
    const response = await this.fetcher(this.url(':commit'), {
      method: 'POST',
      headers: { authorization: `Bearer ${this.idToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ writes }),
    });
    return response.status;
  }
}
