---
type: gotcha
title: A missing runtime-config.js is answered with index.html
date: 2026-11-03
related: [../decisions/firebase-and-auth.md]
enforced_by:
  - src/environments/firebase-config.spec.ts
---

# A missing static file is answered with index.html

`firebase.json` rewrites every unknown path to `/index.html`, and `ng serve` does the same. When `runtime-config.js` is missing (a fresh checkout) or briefly unreachable (a deploy, a flaky network), the browser receives HTML, refuses to run it ("MIME type text/html is not executable"), and `__organizaAiRuntimeConfig` stays undefined. Firebase then starts with the E2E placeholder key and sign-in returns 400 (`key=test-firebase-api-key` in the request).

What keeps this from reaching users:

- `firebaseConfig.apiKey` is a getter, read when Firebase starts, not when the module loads.
- `ensureRuntimeConfig()` in `main.ts` loads the file again (cache-busting query, twice) before bootstrapping and logs an error if it still fails.
- The file is excluded from the service worker manifest (`ngsw-config.json`) and served with `Cache-Control: no-cache`.
- The login page names the cause: "O app está sem a configuração do Firebase."

Locally, create `public/runtime-config.js` from the example and restart `ng serve`: a file added while the server runs is not served until then.
