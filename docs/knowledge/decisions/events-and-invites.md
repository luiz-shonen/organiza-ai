---
type: decision
title: Events, invites and guests (product behaviour)
status: active
date: 2026-11-03
enforced_by:
  - e2e/tests/invites/invites-and-guests.spec.ts
  - src/app/features/home/home.container.spec.ts
  - src/app/features/organizer/dashboard/dashboard.container.spec.ts
  - src/app/features/event-detail/event-detail.container.spec.ts
  - src/app/features/event-detail/components/rsvp-card/rsvp-card.component.spec.ts
  - src/app/features/event-detail/components/rsvp-drawer/rsvp-drawer.component.spec.ts
  - src/app/features/event-detail/components/guest-list-card/guest-list-card.component.spec.ts
  - src/app/core/utils/guest-households.utils.spec.ts
  - src/app/core/models/event.model.spec.ts
related: [firebase-and-auth.md, household-claims.md, design-system.md]
---

# Events, invites and guests

How the app behaves for organizers and guests. Data and permissions are in
[firebase-and-auth](firebase-and-auth.md); what each household brings is in
[household-claims](household-claims.md).

## Where events appear

- **Início** lists invites only: pending, confirmed and declined. Events the account owns or helps
  organize never show there; they live in **Meus eventos**.
- Events are private: Início shows the ones the member opened from an invite link
  (`users/{uid}.invitedEvents`) or answered; Meus eventos the ones they own or collaborate on.
- Início greets with the profile name ("Olá, Jéssica Melo"), never the e-mail prefix.
- Both pages show `app-next-event-banner` at the top ("Evento próximo: Festa, em 7 dias"): on Início
  the nearest event the member confirmed, on Meus eventos the nearest one they organize. An event
  whose start time has passed is skipped.

## Event states (time-aware)

- An event is past as soon as its **start time** passes (`hasStarted(date)`), not at midnight: an
  event today at 8:30 is "Realizado" at 8:31.
- Meus eventos tags each card: **Em breve** (starts within `SOON_DAYS` = 5 days), **Agendado**
  (further ahead), **Realizado** (started), **Cancelado** (`summaryStatus`).
- Início tags each invite: **Pendente**, **Confirmado**, **Recusado**, or **Realizado** once it started.

## Filter chips

- Início: Todos · Pendentes (with a count) · Confirmados · Recusados · Realizados.
- Meus eventos: Todos · Em breve · Agendados · Realizados · Cancelados.
- Chips work like Material filter chips (`org-filter-bar`): the chips that are on show a check,
  several can be on together, and the list shows every event any of them matches, once. "Todos" is
  on by default and on its own; turning the last chip off, or picking "Todos", brings it back.
- Início's list heading names the chip ("Eventos pendentes"); several chips read "Eventos filtrados".

## Tags and colours

- Status tags are filled: Confirmado green, Pendente amber, Recusado and Cancelado red, Agendado
  lilac, Realizado neutral.
- Category tags (Aniversário, Natal…) are a light tint with a thin outline, each category in its own
  colour (`EVENT_CATEGORIES[].hue`, `getCategoryHue`), never the exact green, amber or red of the
  status tags. A typed category gets a stable colour from its name.

## The invite (RSVP)

- An invite is pending, confirmed or declined. Answering needs an account: a visitor who taps
  "Confirmar presença" signs in at `/login?redirect=/evento/{id}` and comes back.
- The RSVP drawer shows "Confirmando como" with the **profile name**, in large type, and does not let
  it be edited. The phone is the **profile phone**; changing it there asks "Atualizar seu telefone?"
  and saves it on the profile too.
- "Levar familiares?" comes before "Levar acompanhantes?". Both are expansion panels with checkboxes
  and a quick "Novo …" form; at most 10 companions per RSVP. Companions come from the member's history
  (`savedCompanions`), also managed on the profile in "Meus acompanhantes".
- Confirmed: the card says "Você está na lista!" with **Editar presença** (reopens the drawer filled
  in) and **Não poderei ir**. "Escolha abaixo o que vocês vão levar" only shows while the household
  picked nothing and the event has items.
- "Não poderei ir" (pending or confirmed) opens an optional message for the organizer ("Recado para
  quem organiza", up to 300 characters). Cancelling a confirmed presence still asks in a danger dialog.
  The invite then shows "Você recusou este convite", with "Confirmar presença" to change one's mind.
- Início's card offers **Responder convite** on a pending invite and **Ver convite** on an answered one.

## The event page

- Section order: event card, RSVP card (not for the organizer), the family checklist, "Lista do
  evento" (hidden from guests when the event has no items), **Quem vai**, Pix.
- "Eu levo" offers the member and only the relatives confirmed with them for this event.
- **Quem vai** (`buildGuestHouseholds`): the header says how many people are going ("8 confirmados").
  One panel per household, titled with the guest's name and a short summary ("+2 · 3 itens"); inside,
  "Convidado(a)" and what they bring, then each relative and companion with their role and a bulleted
  "Leva:" list. The first panel is open, and all of them up to three households.
- Organizers also see phones, "Não poderão ir (N)" with the messages, and Excel / Imprimir as icons in
  the card header. The editor has no guest list.
- "Faltam 5 kg" beside an item is lilac text, not a pill: it informs, "Eu levo" (soft amber) acts.

## Organizer

- Saving an edited event goes back to Meus eventos.
- "Organizado por" shows the owner's profile name (`creatorName`), kept in step when the profile
  name changes; the owner sees "Você".
