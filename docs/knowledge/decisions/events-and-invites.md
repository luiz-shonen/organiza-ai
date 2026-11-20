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
- On both pages **"Todos" is what is still to come**: events that started (or were cancelled) only
  show under their own chip, so history never crowds the list. On Início it is also only what is
  still open for the member, pending and confirmed: a declined invite shows under "Recusados"
  (where it can still be confirmed).
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

## The editor

- Steps: Informações, Endereço, Itens, Amigo oculto, Pix. "Próximo" is never disabled: on a step with
  something missing it says what ("Para continuar, preencha o título e a hora."), marks the fields and
  takes the cursor to the first one. The description is optional.
- "Itens" and "Amigo oculto" open with a question ("Os convidados vão levar alguma coisa?", "Vai ter
  amigo oculto?"); the rest of the step shows only on yes. The items answer is not stored: it is on
  when the event has items, and turning it off with items on the list removes them after a confirm.
- **An event that started is history: it is no longer edited.** The event page hides "Editar
  evento" (and the amigo oculto card its "Participantes" shortcut) once the start time passes, and
  opening `/meus-eventos/evento/{id}` of such an event goes back to its page with "Este evento já
  aconteceu e não pode mais ser editado." Organizers still use the rest of the page (the draw,
  links). The rules do not block it: the owner still writes the event (e.g. closing sign-ups).
- **Endereço comes from the CEP, and what the CEP lacks is typed.** Endereço, Bairro and Cidade/UF
  are locked (read-only, a lock icon, a "not allowed" pointer, no caret) until a full CEP is looked
  up. What ViaCEP fills stays locked; what it leaves empty opens to type, with "O CEP não trouxe o
  endereço completo" above: a rural CEP (e.g. 35830-000, Jaboticatubas/MG) brings only the city,
  and a CEP ViaCEP does not know opens all three. Changing the CEP clears what the last CEP filled
  but keeps what the organizer typed. Bairro is optional. "Sem número" saves the number as "S/N".
  "Complemento" (80 characters, "Km 12, sítio Boa Vista") follows the number on the event page,
  and "Como chegar" (300) shows below the address for places a map does not find well. The rules
  cap each field of `addressDetails`.

## Invites look like invites

- Início shows each invite as a sealed envelope in the colours of its category, "Para {first
  name}"; the whole envelope opens the event page. Its top is the invitation itself: paper with a
  double frame, a handwritten greeting ("Feliz Natal!", "Vem comemorar!"…), title, date block,
  description and "Com carinho, {organizer}". Themes: Natal, Aniversário (also chá de bebê,
  batizado), Casamento (also noivado, chá de panela), Festa Junina, and the app colours for the
  rest. See DESIGN.md, "Invitation themes".

## Approving who confirms (optional)

- Step "Informações" of the editor: **"Aprovar quem confirma pelo link"** (`event.requireApproval`),
  off by default (anyone with the link confirms at once). Only the owner changes it.
- On: a guest's first answer is saved with `approved: false`. Their card says "Aguardando
  aprovação"; they do not count on "Quem vai" or the total, are not offered in "Confirmados no
  evento", cannot claim items and cannot join the amigo oculto alone (the drawer says they join
  after the approval). Relatives follow their guest. Guests from before it was turned on count.
- Organizers see "Aguardando aprovação (N)" at the top of "Quem vai", each with **Aprovar**
  (`approved: true`) or **Recusar** (confirm dialog; removes the guest, their relatives and the
  amigo oculto entries they wrote; they may answer again and wait again).
- Rules: with approval on, a new answer must carry `approved: false`; a guest never changes
  `approved` on their own answer; only an approved guest writes amigo oculto entries. Not enforced:
  claims (the screen stops them) and Início, which still shows the invite as "Confirmado".

## The event page

- Section order: event card, RSVP card (not for the organizer), the family checklist, "Lista do
  evento" (hidden from guests when the event has no items), **Quem vai**, "Amigo oculto" (organizers
  only, when the event has one; see [secret-santa](secret-santa.md)), Pix.
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
