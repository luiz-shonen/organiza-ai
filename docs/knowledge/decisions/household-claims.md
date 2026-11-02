---
type: decision
title: Household claims for the event list
status: active
date: 2026-11-02
enforced_by:
  - firestore.rules
  - e2e/rules/claims.rules.test.ts
  - src/app/core/utils/item-progress.utils.spec.ts
related: [firebase-and-auth.md, angular-architecture.md]
---

# Household claims for the event list

What each family brings to an event lives in `events/{eventId}/claims/{uid}`: one document per
account holder with `name`, `entries` and `updatedAt`. Each entry is one person of the household
(`memberId` is a family member id, or `null` for the account holder) bringing `quantity` of one
item, plus the `bought` check of the family checklist.

- Only the account holder writes their document (`request.auth.uid == uid`), so nobody can change
  another family's share. Anyone can read, like the items themselves.
- Progress is derived on the client by `buildItemProgress`: an item is complete when the shares
  add up to its `quantity`. The old single `claimedBy` on an item still counts as one share of
  the whole quantity, so events created before claims keep working.
- Picking the same item again for the same person adds to the existing line (`addClaimEntry`).
- Items may carry `unit` ("un.", "L", "pacotes") and `fixedQuantity`: whoever picks a fixed item
  brings all of it, so the "Eu levo" sheet skips the quantity.
- Units are picked from a fixed list in the plural (`ITEM_UNITS` in `item-form`); `formatQuantity`
  and `unitFor` read one of them in the singular ("1 panela", "2 panelas").
- Items are edited in a side drawer with the same form as adding (`ItemService.updateItem`
  changes name, quantity, unit and the fixed flag; who already claimed stays).
- When a signed-in account holder cancels the RSVP, their household document is deleted in the
  same batch. A guest who confirmed by phone only has no claims document, and the rules would
  reject the delete, so `cancelRsvp` deletes it only when it is given the household uid.

Over-claiming beyond the quantity is prevented by the UI (the sheet caps at what is missing);
the rules do not count across documents.
