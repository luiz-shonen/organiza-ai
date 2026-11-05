---
type: decision
title: Firebase, auth and permissions
status: active
supersedes: [AD-004, AD-005, AD-016, AD-017, AD-019, AD-022, AD-023, AD-024]
enforced_by:
  - firestore.rules
  - e2e/rules/*.rules.test.ts
related: [routes-and-domains.md, events-and-invites.md]
---

# Firebase, auth and permissions

What the screens do with this data (invite states, filters, "Quem vai") is in
[events-and-invites](events-and-invites.md).

- Firebase modular SDK used directly; no `@angular/fire`.
- Super admins are hardcoded in `AuthService.isSuperAdmin` and `firestore.rules`: `luiz.gmr.dev@gmail.com`, `jessica.calm.dev@gmail.com`.
- Open registration: any account signed in with Google or e-mail creates events it owns (`createdBy` must be its uid); anonymous RSVP accounts cannot. `/admins` keeps full write access on top of that.
- `firestore.rules` enforces the roles: the owner edits, cancels and deletes the event (and never changes `createdBy`) and invites; owner and collaborators manage items and guests; an invited account adds only its own uid to `collaborators`, while its invitation exists.
- Rules deploy only from `main` (`cd.yml`), so a PR preview runs against the rules already in production.
- The CD service account needs **Cloud Datastore Index Admin** to deploy `firestore.indexes.json`; without it the deploy fails with 403 and Hosting is not published ([gotcha](../gotchas/index-deploy-needs-index-admin.md)).
- Manual testing on the real project uses an e-mail test account (a regular user, not a super admin). Its e-mail and password live only in the gitignored `.env.local` (`TEST_ACCOUNT_EMAIL`, `TEST_ACCOUNT_PASSWORD`; names in `.env.example`), because the repository is public. E2E tests never use it; they mock auth.
- The editor shows "Sua conta não tem permissão para salvar este evento." when Firestore refuses a save.
- Signing in locally needs `public/runtime-config.js` (gitignored, copied from `runtime-config.example.js`) with the real web API key; without it the app falls back to the E2E placeholder key and every sign-in returns 400.
- `runtime-config.js` stays out of the service worker cache and is served with `Cache-Control: no-cache`; when it fails to load, `ensureRuntimeConfig` (in `main.ts`) loads it again before the app starts, so the first sign-in never goes out with the placeholder key.
- The login page turns Firebase error codes into plain messages: "E-mail ou senha incorretos." (wrong password, or an e-mail that already has an account), too many attempts, no connection, and a missing API key.
- Each event has one owner (creator) and zero or more collaborators. Owners edit core data, cancel and delete; collaborators manage items and see guests.
- Collaborators are invited by e-mail at `events/{id}/invitations/{email}` and auto-claimed on login.
- E-mail/password accounts get a non-blocking verification banner.
- The rules check the fields people write, because a client can skip the app's value objects. The limits are looser than the app's, so they stop abuse without rejecting anything the app saves:
  - Names on profiles, family members, guests, claims and item claims have at most 120 characters and no `< > { }`.
  - Phones are empty, or 10 to 20 digits and phone punctuation.
  - A family relationship must be one of the six options.
  - A theme must be `light`, `dark` or `system`.
  - Events only have size limits: a title of up to 200 characters, a description of up to 2000, and a location of up to 500.
- On an update, the rules check only the fields that change. That way an older document with a value outside the rules can still be edited.
- There are no anonymous sessions (no `signInAnonymously`, no guest session in local storage): answering an invite needs an account, and the rules accept RSVPs from account holders only. A visitor signs in at `/login?redirect=/evento/{id}`; the login only follows app paths.
- The RSVP saves the guest with the profile name and phone; a phone changed in the drawer is written to the profile too.
- Companions outside the family are picked in "Levar acompanhantes?", the same panel as "Levar familiares?": names the member brought before come from `users/{uid}.savedCompanions` (up to 50), "Novo acompanhante" adds one, and up to 10 go with one RSVP. Confirming adds the chosen names to that history. The profile page manages the same list in "Meus acompanhantes" (add, rename, remove), like "Minha família"; a rename or removal changes the history only, not RSVPs already made.
- Each user keeps a private family roster at `users/{uid}/family`, used for batch RSVP.
- A member added with "Novo membro" in the RSVP drawer is saved to that roster at once (the page passes `addFamilyMember` in the drawer data) and selected; the drawer closes only on "Confirmar". The quick form is a group, not a `<form>`, because it sits inside the RSVP form.
- An invite is pending, confirmed or declined. Confirming adds the event to `users/{uid}.rsvpEvents` (Início reads it first; an older confirmation is added when the member opens the event), cancelling removes it.
- "Não poderei ir" (on a pending invite, or cancelling a confirmed one) opens an optional message for the organizer (`DeclineMessage`, up to 300 characters). It saves `events/{id}/declines/{uid}` ({name, message, declinedAt}), read only by that account and the event's owner and collaborators, who see it under "Não poderão ir" in "Quem vai" on the event page; and it adds the event to `users/{uid}.declinedEvents`, so Início tags it "Recusado", lists it under "Recusados" and leaves it out of "Pendentes". Confirming removes both.
- The collection group lookups (`guests.uid`, `invitations.invitedEmail`) need the single-field overrides in `firestore.indexes.json`; Firestore does not index collection group scope by default.
