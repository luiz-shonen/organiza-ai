/** Firebase calls the relay makes as the person who is signed in, so Firestore's rules apply. */

export interface Account {
  readonly uid: string;
  readonly email: string;
}

/** Who this ID token belongs to; null when it is invalid or expired. */
export async function lookupAccount(
  idToken: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<Account | null> {
  const response = await fetcher(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as { users?: { localId?: string; email?: string }[] };
  const user = body.users?.[0];
  if (!user?.localId) return null;
  return { uid: user.localId, email: (user.email ?? '').toLowerCase() };
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function plain(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(plain);
  if ('mapValue' in value) return plainFields(value.mapValue.fields ?? {});
  return null;
}

function plainFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, plain(value)]));
}

/**
 * Reads one document as the signed-in person: the rules decide. Null when it is missing or
 * they may not read it.
 */
export async function readDocAs(
  path: string,
  idToken: string,
  projectId: string,
  fetcher: typeof fetch = fetch,
): Promise<Record<string, unknown> | null> {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetcher(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encoded}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  return plainFields(body.fields ?? {});
}
