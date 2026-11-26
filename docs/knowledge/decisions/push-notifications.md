---
type: decision
title: Notices between people and phone push
status: active
date: 2026-11-25
updated: 2026-11-26
enforced_by:
  - firestore.rules
  - e2e/rules/notifications.rules.test.ts
  - push-worker/test/relay.test.ts
  - src/app/core/services/push.service.spec.ts
  - src/app/core/services/people-notices.service.spec.ts
  - src/app/core/services/notification.service.spec.ts
  - src/app/shared/components/notification-bell/notification-bell.component.spec.ts
  - src/app/shared/ui/navigation/org-notification-menu.component.spec.ts
related: [events-and-invites.md, secret-santa.md, firebase-and-auth.md, workflow.md]
---

# Notices between people and phone push

When someone does something the people of an event need to know, the app writes a notice to
each recipient's bell (`users/{uid}/notifications/{id}`) and asks the push relay to send it to
their phones. The bell is the in-app history; the phone's notification center is the system
history. Both always get the notice; a failed push never fails the action.

## Who is told what

| Action                                                     | Kind            | Recipients                             | Notice id                              |
| ---------------------------------------------------------- | --------------- | -------------------------------------- | -------------------------------------- |
| Confirms, asks approval, edits, declines, cancels presence | `presence`      | Owner and collaborators, not the actor | `presence_{eventId}_{actorUid}`        |
| Accepts an invite to help organise / leaves it             | `collaboration` | Owner and collaborators, not the actor | `collaboration_{eventId}_{actorUid}`   |
| Approves a pending presence                                | `approval`      | The guest                              | `approval_{eventId}`                   |
| Draws the amigo oculto                                     | `secret-santa`  | Each participant with an account       | `secret-santa_{eventId}`               |
| Invites someone to help organise                           | (invitation)    | The invited e-mail, if it has a device | `events/{eventId}/invitations/{email}` |

Texts are Portuguese, built in `PeopleNoticesService` ("Ana confirmou presença", "Bia saiu da
colaboração", "Sua presença foi aprovada"). One id per actor and event: a new answer replaces
the previous notice instead of piling up.

## Firestore rules (`firestore.rules`, `isNoticeToOrganizer`, `isApprovalNotice`)

- A person writes a notice into someone else's bell only when the id, `kind`, `actorUid`
  (= the writer) and the event check out: presence/collaboration go only to people who manage
  that event; approval only from someone who manages it, to a guest who has a presence there.
- The writer may `get` a notice they wrote (`actorUid == auth.uid`). That is how the relay,
  acting with the writer's token, proves the notice exists before pushing it.

## The relay (`push-worker/`)

- A Cloudflare Worker on the free plan (`organizaai-push.*.workers.dev`), not Cloud Functions:
  no Blaze plan. Standard Web Push (VAPID), shown by Angular's service worker; no FCM.
- `POST /devices` saves the browser's subscription (the user is checked with Identity Toolkit);
  `POST /devices/remove` drops it (sign-out, turning off); `POST /notify {path}` reads the
  notice from Firestore over REST **with the caller's ID token**, so the security rules decide
  who may notify whom. Each notice version is pushed once (`sent:` key in KV, 30 days).
- Devices live in KV (`DEVICES`). Gone subscriptions (404/410) are removed on send.
- **One device, one account:** a browser receives only the notices of the last account that
  turned notifications on in it (`owner:{sha256(endpoint)}`); signing in with another account
  moves it.

## Deploy and secrets

- The CD (`.github/workflows/cd.yml`, step "Deploy Push Relay") runs `wrangler deploy`, then
  `wrangler secret bulk`, and writes the `*.workers.dev` URL into `runtime-config.js` as
  `push.url`. Without a URL the app hides the push option (`PushService.state` =
  `unsupported`). The step is `continue-on-error`: a relay failure never blocks Hosting.
- The KV namespace has no `id` in `wrangler.toml`: the first deploy creates it, later deploys
  reuse the one bound to the Worker.
- GitHub secrets (set by hand, once): `CLOUDFLARE_WORKER_TOKEN` (API token with Workers Scripts
  Edit and Workers KV Storage Edit), `PUSH_VAPID_PRIVATE_KEY`, and the existing
  `FIREBASE_API_KEY`. Optional: `CLOUDFLARE_ACCOUNT_ID`, only if the token sees more than one
  account. Missing token or key → the step warns and skips.
- The VAPID **public** key is in code (`push-worker/wrangler.toml` and
  `PUSH_VAPID_PUBLIC_KEY` in `src/environments/firebase-config.ts`); both must match the
  private key. Rotating the pair means changing both and every device subscribing again.

## In the app

- Permission is asked only when the person taps "Ativar notificações no celular" in the bell
  menu footer, never on page load. A device that already allowed notifications turns itself on
  at sign-in, unless the person turned it off there (`organizaai.push.off` in localStorage).
- iPhone/iPad: Web Push works only with the app added to the Home Screen (iOS 16.4+); in Safari
  the footer says how to install instead of offering the switch.
- Sign-out removes the device from the relay first (`PushService.forgetDevice`).
