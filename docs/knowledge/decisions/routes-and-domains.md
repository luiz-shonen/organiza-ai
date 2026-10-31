---
type: decision
title: Routes and feature domains
status: active
supersedes: [AD-020, AD-027, AD-037]
enforced_by:
  - src/app/app.routes.spec.ts
  - src/app/features/organizer/organizer.routes.spec.ts
  - src/app/features/admin/admin.routes.spec.ts
related: [firebase-and-auth.md]
---

# Routes and feature domains

| Route              | Folder                   | Access            |
| ------------------ | ------------------------ | ----------------- |
| `/`                | `features/home`          | public            |
| `/login`           | `features/auth`          | public            |
| `/evento/:id`      | `features/event-detail`  | public            |
| `/perfil`          | `features/profile`       | `authGuard`       |
| `/meus-eventos/**` | `features/organizer`     | `authGuard`       |
| `/admin/**`        | `features/admin`         | `superAdminGuard` |
| `/design-system`   | `features/design-system` | `superAdminGuard` |

`/meus-eventos` is the organizer area for any signed-in user; `/admin` is platform metrics for super admins only. Do not mix them.
