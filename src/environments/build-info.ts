import type { AppVersion } from './firebase-config';

/**
 * The version this code was built as, baked in at build time: the deploy workflows overwrite this
 * file before `npm run build` (see `.github/workflows/cd.yml`). Unlike `runtime-config.js`, which
 * is always fetched fresh, it travels with the code the service worker keeps, so the footer names
 * the version that is really running. Empty when built locally ("Versão local").
 */
export const BUILD_INFO: AppVersion = {};
