---
type: gotcha
title: Deploying Firestore indexes needs the Index Admin role
date: 2026-11-05
related: [../decisions/firebase-and-auth.md]
enforced_by:
  - .github/workflows/cd.yml
---

# Deploying Firestore indexes needs the Index Admin role

`cd.yml` deploys `firestore.rules`, `firestore.indexes.json` and Hosting from `main`, signed in as the
service account in the `FIREBASE_SERVICE_ACCOUNT_ORGANIZA_AI_3416F` secret. The field overrides in
`firestore.indexes.json` (`guests.uid` and `invitations.invitedEmail`, for collection-group queries)
are written through the Firestore admin API, which the Firebase Hosting roles do not cover.

Without the role, the deploy stops with `403 The caller does not have permission` on
`collectionGroups/guests/fields/uid`, and Hosting is never published: production keeps the previous
build while the new rules may already be live.

The service account needs **Cloud Datastore Index Admin** (`roles/datastore.indexAdmin`), granted in
Google Cloud IAM for the `organiza-ai-3416f` project (done on 2026-11-05). A new service account, or a
new Firebase project, needs it granted again before its first deploy that touches indexes.
