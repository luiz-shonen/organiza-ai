import type { FirebaseOptions } from 'firebase/app';

interface RuntimeFirebaseConfig {
  apiKey?: string;
}

interface OrganizaAiRuntimeConfig {
  firebase?: RuntimeFirebaseConfig;
}

type RuntimeGlobal = typeof globalThis & {
  __organizaAiRuntimeConfig?: OrganizaAiRuntimeConfig;
};

const runtimeConfig = (globalThis as RuntimeGlobal).__organizaAiRuntimeConfig;

/**
 * Firebase web API keys are public client identifiers, but keeping the live
 * value outside source control allows it to be rotated without a code change.
 */
export const firebaseConfig: FirebaseOptions = {
  projectId: 'organiza-ai-3416f',
  appId: '1:901742626768:web:2457cc64896abd2d4e5bd5',
  storageBucket: 'organiza-ai-3416f.firebasestorage.app',
  apiKey: runtimeConfig?.firebase?.apiKey ?? 'test-firebase-api-key',
  authDomain: 'organiza-ai-3416f.firebaseapp.com',
  messagingSenderId: '901742626768',
  measurementId: 'G-HK4Y44QBTV',
};
