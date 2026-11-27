import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle, type Env } from '../src/index';
import { isFetchable, previewLink, readPage } from '../src/preview';

const PRODUCT = `<!doctype html><html><head>
<title>Loja</title>
<meta property="og:title" content="Conjunto de Chaves de Fenda 50 em 1 &amp; Catraca">
<meta content="Kit magnético portátil" property="og:description">
<meta property="og:image" content="/img/chaves.jpg">
<meta property="og:site_name" content="AliExpress">
<meta property="product:price:amount" content="89.9">
<meta property="product:price:currency" content="BRL">
</head><body>…</body></html>`;

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

let safeBrowsingMatches: unknown[] = [];
let fetched: string[] = [];

const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  fetched.push(url);
  if (url.startsWith('https://identitytoolkit.googleapis.com/')) {
    const { idToken } = JSON.parse(String(init?.body));
    return idToken === 'token-ana'
      ? Response.json({ users: [{ localId: 'ana', email: 'ana@test.com' }] })
      : new Response('{}', { status: 400 });
  }
  if (url.startsWith('https://safebrowsing.googleapis.com/')) {
    return Response.json(safeBrowsingMatches.length ? { matches: safeBrowsingMatches } : {});
  }
  if (url === 'https://bit.ly/chaves') {
    return new Response(null, {
      status: 301,
      headers: { location: 'https://pt.aliexpress.com/item/1.html' },
    });
  }
  if (url === 'https://bit.ly/interno') {
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } });
  }
  if (url === 'https://pt.aliexpress.com/item/1.html') return html(PRODUCT);
  if (url === 'https://loja.com.br/bloqueia') return html('captcha', 403);
  return html('<title>Outra</title>');
}) as unknown as typeof fetch;

beforeEach(() => {
  safeBrowsingMatches = [];
  fetched = [];
});

describe('link preview', () => {
  it('reads the title, picture, site and price the page shares, like WhatsApp', () => {
    expect(readPage(PRODUCT, new URL('https://pt.aliexpress.com/item/1.html'))).toEqual({
      title: 'Conjunto de Chaves de Fenda 50 em 1 & Catraca',
      description: 'Kit magnético portátil',
      image: 'https://pt.aliexpress.com/img/chaves.jpg',
      siteName: 'AliExpress',
      price: expect.stringMatching(/R\$\s?89,90/),
    });
  });

  it('follows a short link to the real store and checks both addresses', async () => {
    const preview = await previewLink('https://bit.ly/chaves', 'sb-key', fakeFetch);
    expect(preview).toMatchObject({
      finalUrl: 'https://pt.aliexpress.com/item/1.html',
      host: 'pt.aliexpress.com',
      title: 'Conjunto de Chaves de Fenda 50 em 1 & Catraca',
      dangerous: false,
      unreadable: false,
    });
  });

  it('marks a link Google lists as dangerous', async () => {
    safeBrowsingMatches = [{ threatType: 'SOCIAL_ENGINEERING' }];
    const preview = await previewLink('https://golpe.example.com/premio', 'sb-key', fakeFetch);
    expect(preview?.dangerous).toBe(true);
  });

  it('says it could not check without a Safe Browsing key', async () => {
    const preview = await previewLink('https://loja.com.br/x', undefined, fakeFetch);
    expect(preview?.dangerous).toBeNull();
  });

  it('never reaches private addresses, not even through a redirect', async () => {
    expect(isFetchable('http://127.0.0.1/admin')).toBeNull();
    expect(isFetchable('http://localhost:8080/')).toBeNull();
    expect(isFetchable('http://[::1]/')).toBeNull();
    expect(isFetchable('javascript:alert(1)')).toBeNull();
    expect(isFetchable('https://user:pass@loja.com.br/')).toBeNull();
    const preview = await previewLink('https://bit.ly/interno', 'sb-key', fakeFetch);
    expect(fetched).not.toContain('http://127.0.0.1/admin');
    expect(preview).toMatchObject({ unreadable: true, finalUrl: 'https://bit.ly/interno' });
  });

  it('still answers with the address when the store blocks the reading', async () => {
    const preview = await previewLink('https://loja.com.br/bloqueia', 'sb-key', fakeFetch);
    expect(preview).toMatchObject({ unreadable: true, host: 'loja.com.br', title: '' });
  });
});

describe('POST /preview', () => {
  class MemoryKv {
    readonly data = new Map<string, string>();
    async get(key: string, type?: string) {
      const value = this.data.get(key) ?? null;
      return value !== null && type === 'json' ? JSON.parse(value) : value;
    }
    async put(key: string, value: string) {
      this.data.set(key, value);
    }
    async delete(key: string) {
      this.data.delete(key);
    }
  }
  let env: Env;

  beforeEach(() => {
    env = {
      DEVICES: new MemoryKv() as unknown as KVNamespace,
      FIREBASE_PROJECT_ID: 'p',
      FIREBASE_API_KEY: 'key',
      APP_ORIGIN: 'https://organizaai.web.app',
      VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
      SAFE_BROWSING_API_KEY: 'sb-key',
    };
  });

  const call = (token: string | null, url: string) =>
    handle(
      new Request('https://push.test/preview', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://organizaai.web.app',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url }),
      }),
      env,
      fakeFetch,
    );

  it('answers signed-in people only, and keeps the answer for a day', async () => {
    expect((await call(null, 'https://bit.ly/chaves')).status).toBe(401);
    expect((await call('bad', 'https://bit.ly/chaves')).status).toBe(401);

    const first = await call('token-ana', 'https://bit.ly/chaves');
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ host: 'pt.aliexpress.com' });

    fetched = [];
    const again = await call('token-ana', 'https://bit.ly/chaves');
    expect(await again.json()).toMatchObject({ host: 'pt.aliexpress.com' });
    expect(fetched.filter((u) => u.includes('aliexpress'))).toHaveLength(0);
  });

  it('refuses what is not a web address', async () => {
    expect((await call('token-ana', 'http://10.0.0.1/')).status).toBe(400);
  });
});
