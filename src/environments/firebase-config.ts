import type { FirebaseOptions } from 'firebase/app';

interface RuntimeFirebaseConfig {
  apiKey?: string;
}

interface OrganizaAiRuntimeConfig {
  firebase?: RuntimeFirebaseConfig;
  /** The push relay (push-worker/), e.g. `https://organizaai-push.x.workers.dev`. */
  push?: { url?: string };
}

type RuntimeGlobal = typeof globalThis & {
  __organizaAiRuntimeConfig?: OrganizaAiRuntimeConfig;
};

const RUNTIME_CONFIG_URL = 'runtime-config.js';

/** The key E2E tests serve themselves; it only reaches Firebase when the real one is missing. */
export const PLACEHOLDER_FIREBASE_API_KEY = 'test-firebase-api-key';

function runtimeConfig(): OrganizaAiRuntimeConfig | undefined {
  return (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig;
}

/**
 * `index.html` loads `runtime-config.js` before the app, but that request can fail
 * (a deploy swapping files, a flaky network). Load it again, skipping every cache,
 * so the first sign-in does not go out with the placeholder key and need a reload.
 */
export async function ensureRuntimeConfig(attempts = 2): Promise<void> {
  for (let attempt = 1; !runtimeConfig() && attempt <= attempts; attempt++) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = `${RUNTIME_CONFIG_URL}?retry=${Date.now()}`;
      script.onload = script.onerror = () => {
        script.remove();
        resolve();
      };
      document.head.appendChild(script);
    });
  }
  if (!runtimeConfig()) {
    console.error(`${RUNTIME_CONFIG_URL} did not load; Firebase gets the placeholder API key.`);
  }
}

/**
 * Firebase web API keys are public client identifiers, but keeping the live
 * value outside source control allows it to be rotated without a code change.
 * The key is read when Firebase starts, after `ensureRuntimeConfig`, not when
 * this module loads.
 */
export const firebaseConfig: FirebaseOptions = {
  projectId: 'organiza-ai-3416f',
  appId: '1:901742626768:web:2457cc64896abd2d4e5bd5',
  storageBucket: 'organiza-ai-3416f.firebasestorage.app',
  get apiKey(): string {
    return runtimeConfig()?.firebase?.apiKey ?? PLACEHOLDER_FIREBASE_API_KEY;
  },
  authDomain: 'organiza-ai-3416f.firebaseapp.com',
  messagingSenderId: '901742626768',
  measurementId: 'G-HK4Y44QBTV',
};

/** The push relay's address; empty while it is not deployed (the push option then hides). */
export function pushRelayUrl(): string {
  return (runtimeConfig()?.push?.url ?? '').replace(/\/+$/, '');
}

/** The relay's VAPID public key (push-worker/wrangler.toml): phones subscribe with it. */
export const PUSH_VAPID_PUBLIC_KEY =
  'BCGxsXK81qwaIhFNd4fvDbtix9YM7LBDaVwHxdMqLD9Y36UDl9cOhlX2afcrffBpwOE5dq0-TtWyrn0Cb6hmgDg';
