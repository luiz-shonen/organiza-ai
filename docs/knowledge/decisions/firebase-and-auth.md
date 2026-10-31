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
- Each event has one owner (creator) and zero or more collaborators. Owners edit core data, cancel and delete; collaborators manage items and see guests.
- Collaborators are invited by e-mail at `events/{id}/invitations/{email}` and auto-claimed on login.
- E-mail/password accounts get a non-blocking verification banner.
- RSVP requires a verified identity (Google or signed-in profile). Never write anonymous users to `users`; check `!user.isAnonymous`.
- Each user keeps a private family roster at `users/{uid}/family`, used for batch RSVP.
