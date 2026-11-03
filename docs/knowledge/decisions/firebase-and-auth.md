---
type: decision
title: Firebase, auth and permissions
status: active
supersedes: [AD-004, AD-005, AD-016, AD-017, AD-019, AD-022, AD-023, AD-024]
enforced_by:
  - firestore.rules
  - e2e/rules/*.rules.test.ts
related: [routes-and-domains.md]
---

# Firebase, auth and permissions

- Firebase modular SDK used directly; no `@angular/fire`.
- Super admins are hardcoded in `AuthService.isSuperAdmin` and `firestore.rules`: `luiz.gmr.dev@gmail.com`, `jessica.calm.dev@gmail.com`.
- Open registration: any authenticated Google or e-mail user can create events.
- Manual testing on the real project uses an e-mail test account (a regular user, not a super admin). Its e-mail and password live only in the gitignored `.env.local` (`TEST_ACCOUNT_EMAIL`, `TEST_ACCOUNT_PASSWORD`; names in `.env.example`), because the repository is public. E2E tests never use it; they mock auth.
- Signing in locally needs `public/runtime-config.js` (gitignored, copied from `runtime-config.example.js`) with the real web API key; without it the app falls back to the E2E placeholder key and every sign-in returns 400.
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
- RSVP requires a verified identity (Google or signed-in profile). Never write anonymous users to `users`; check `!user.isAnonymous`.
- Each user keeps a private family roster at `users/{uid}/family`, used for batch RSVP.
