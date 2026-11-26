/**
 * The free AI providers, tried in order within one request: each Gemini model, then each
 * Groq model. Any failure (429, 5xx, timeout, an answer that does not parse) moves on.
 */

export interface Provider {
  readonly name: string;
  /** The model's raw text answer. */
  ask(system: string, user: string, fetcher: typeof fetch): Promise<string>;
}

export class AllBusyError extends Error {
  constructor(readonly tried: string[]) {
    super(`every provider failed: ${tried.join(', ')}`);
  }
}

const TIMEOUT_MS = 15_000;

function models(list: string | undefined): string[] {
  return (list ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
}

async function postJson(
  fetcher: typeof fetch,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function gemini(model: string, apiKey: string): Provider {
  return {
    name: `gemini:${model}`,
    async ask(system, user, fetcher) {
      const body = (await postJson(
        fetcher,
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        { 'x-goog-api-key': apiKey },
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        },
      )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
      if (!text) throw new Error('empty answer');
      return text;
    },
  };
}

function groq(model: string, apiKey: string): Provider {
  return {
    name: `groq:${model}`,
    async ask(system, user, fetcher) {
      const body = (await postJson(
        fetcher,
        'https://api.groq.com/openai/v1/chat/completions',
        { authorization: `Bearer ${apiKey}` },
        {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 1024,
        },
      )) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content;
      if (!text) throw new Error('empty answer');
      return text;
    },
  };
}

export interface ProviderEnv {
  readonly GEMINI_API_KEY?: string;
  readonly GROQ_API_KEY?: string;
  readonly GEMINI_MODELS?: string;
  readonly GROQ_MODELS?: string;
}

/** Gemini first, Groq as the fallback; a provider without a key is left out. */
export function providers(env: ProviderEnv): Provider[] {
  return [
    ...(env.GEMINI_API_KEY
      ? models(env.GEMINI_MODELS).map((m) => gemini(m, env.GEMINI_API_KEY!))
      : []),
    ...(env.GROQ_API_KEY ? models(env.GROQ_MODELS).map((m) => groq(m, env.GROQ_API_KEY!)) : []),
  ];
}

/** The first answer that `parse` accepts, and who gave it. */
export async function firstAnswer<T>(
  list: readonly Provider[],
  system: string,
  user: string,
  parse: (text: string) => T,
  fetcher: typeof fetch = fetch,
): Promise<{ value: T; provider: string }> {
  const tried: string[] = [];
  for (const provider of list) {
    try {
      const value = parse(await provider.ask(system, user, fetcher));
      return { value, provider: provider.name };
    } catch (error) {
      tried.push(`${provider.name} (${error instanceof Error ? error.message : 'error'})`);
    }
  }
  throw new AllBusyError(tried);
}
