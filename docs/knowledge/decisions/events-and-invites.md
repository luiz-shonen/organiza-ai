---
type: decision
title: Events, invites and guests (product behaviour)
status: active
date: 2026-11-03
updated: 2026-11-26
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
  - src/app/features/event-detail/guest-list-pdf.spec.ts
  - src/app/core/utils/guest-list-document.utils.spec.ts
  - src/app/core/services/name-sync.service.spec.ts
  - src/app/shared/ui/navigation/org-stepper.component.spec.ts
  - e2e/tests/organizer/secret-santa.spec.ts
  - e2e/tests/invites/manual-guests.spec.ts
  - e2e/rules/manual-guests.rules.test.ts
  - src/app/features/event-detail/components/manual-guest-form/manual-guest-form.component.spec.ts
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
- The first confirmation also asks for the amigo oculto, when the event has one (see
  [secret-santa](secret-santa.md)); **Editar presença** does not: from then on the guest changes
  their entries in the invite's "Amigo oculto" card.
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
- Moving to the next step scrolls the stepper back into view and puts the cursor in the step's first
  field once its animation ends (`org-stepper`).
- A collaborator sees some fields locked (disabled controls): a step counts as filled when its form
  is not invalid (`!form.invalid`), so they can still go on.
- "Itens" and "Amigo oculto" open with a question ("Os convidados vão levar alguma coisa?", "Vai ter
  amigo oculto?"); the rest of the step shows only on yes. The items answer is not stored: it is on
  when the event has items, and turning it off with items on the list removes them after a confirm.
- **An event that started is history: it is no longer edited.** The event page hides "Editar
  evento" (and the amigo oculto card its "Participantes" shortcut) once the start time passes, and
  opening `/meus-eventos/evento/{id}` of such an event goes back to its page with "Este evento já
  aconteceu e não pode mais ser editado." Organizers still use the rest of the page (the draw,
  links). The rules do not block it: the owner still writes the event (e.g. closing sign-ups).
- **A reload does not lose what is being typed.** The editor keeps a draft in the browser
  (`FormDraftService`, localStorage, per account and per event, "novo" while creating) for three
  days: the three forms, the switches and, while creating, the items and amigo oculto list. It
  is kept only once the organizer typed or switched something (the CEP lookup filling fields
  does not count). Opening the editor again brings it back with "Recuperamos o que você estava
  preenchendo (20/11 às 15:05)", only when it differs from the event as saved, with **Desfazer** (an
  undo icon alone on a phone) to go back to the event as saved, and a ✕ that only hides the
  notice. Saving or "Cancelar" drops it. The step the organizer was on is kept too:
  a reload opens it (creating, only once the steps before it are filled in).
- **Amigo oculto participants.** Typing a name offers people the organizer already knows
  (`KnownPeopleService`): their family and the guests, companions and participants of up to 20
  other events they own or help organize, never events they were only invited to. Picking one
  fills the phone. Gift ideas use the shared field (`app-gift-options-field`, the same in the
  organizer's sheet, the RSVP drawer and the guest's own card): a title with "2 de 3", the ideas
  as rows (tap or pencil to edit in place, ✕ to remove), and one compact "Nova opção" / "Adicionar
  mais uma opção" field with a lilac + beside it (or Enter). One still typed goes with the
  participant. A failed add keeps what was
  typed, and every error says why (`explainError`).
- **Whose gift ideas they are.** Someone who joined from the invite (`joinedBy`) owns their gift
  ideas and phone: a pencil on their own entries in the guest's "Amigo oculto" card opens the
  same participant form the organizers use (also still in "Editar presença"), while sign-ups
  are open. Organizers only
  rename them (the edit sheet shows the ideas read only), and "Juntar" keeps the guest's ideas.
  Ideas of people added by hand stay the organizers' to edit. `firestore.rules` enforces it on
  `secretSantaParticipants` and the matching `secretSantaRoster` entry. In the organizers' list
  each person's ideas fold under the name ("2 ideias de presente ▾"), one 🎁 line each.
- **An event may run over several days.** Step "Informações" has "Data de início" and an optional
  "Data de término"; empty (or the same day) is a one-day event, and a last day before the first
  one does not move on. It is saved as `endDate` ("2026-12-25") only when it is after the start
  day, otherwise null. The invite reads "Quarta a sexta · 23–25 · Dez · 17:00" and "De 23 a 25
  de dezembro · 17:00", the envelope "23 a 25 de dez.", Meus eventos' badge "23–25", WhatsApp
  "23 a 25 de dezembro", and "Adicionar ao calendário" runs to the end of the last day. The
  states above still follow the start: such an event is "Realizado" once it begins.
- **Endereço comes from the CEP, and what the CEP lacks is typed.** Endereço, Bairro and Cidade/UF
  are locked (read-only, a lock icon, a "not allowed" pointer, no caret) until a full CEP is looked
  up. What ViaCEP fills stays locked; what it leaves empty opens to type, with "O CEP não trouxe o
  endereço completo" above: a rural CEP (e.g. 35830-000, Jaboticatubas/MG) brings only the city,
  and a CEP ViaCEP does not know opens all three. Changing the CEP clears what the last CEP filled
  but keeps what the organizer typed. Bairro is required ("Zona rural" when there is none). "Sem número" saves the number as "S/N".
  "Complemento" (80 characters, "Km 12, sítio Boa Vista") follows the number on the event page,
  and "Como chegar" (300) shows below the address for places a map does not find well. The rules
  cap each field of `addressDetails`.

## Invites look like invites

- Início shows each invite as a sealed envelope in the colours of its category, "Para {first
  name}"; the whole envelope opens the event page. Its top is the invitation itself: paper with a
  double frame, scrolled corners and medallions, a handwritten greeting and a line in the tone of
  a formal printed invitation, a little over the top on purpose ("Boas Festas!", "Rogamos a honra
  de vossa presença à mesa natalina"), title, date block, description and "Cordialmente,
  {organizer}". Every ready-made category (and a few often typed: noivado, mesversário,
  réveillon) has its own greeting and line, so a Batizado never says a birthday's words; any other
  category says the "Outros" words ("Prezadíssimo convidado"). Colours come in five palettes:
  Natal, Aniversário (also mesversário, chá de bebê, batizado), Casamento (also noivado, chá de
  panela), Festa Junina, and the app colours for the rest. See DESIGN.md, "Invitation themes".
- The paper is light in the light theme and dark in the dark one, each theme with its own dark
  tone (`$invite-themes-dark`); the envelopes follow.
- The category shows only where the words do not already say it: a typed "Sarau" in small
  capitals over "Prezadíssimo convidado" (never a bare "Outros"); none for the known ones.
- Each time the invitation opens it unfolds, its frame draws itself, greeting and signature are
  written in and the rest comes in in reading order (about 3 s); with reduced motion it is simply
  there.

## Approving who confirms (optional)

- Step "Informações" of the editor: **"Exigir aprovação de presença"** (`event.requireApproval`),
  off by default (anyone with the link confirms at once). Only the owner changes it.
- The switch's hint explains it in plain words: off, whoever confirms by the link is on the list
  at once; on, only after the owner approves.
- On: a guest's first answer is saved with `approved: false`. Their card says "Aguardando
  aprovação"; they do not count on "Confirmados" or the total and cannot claim items. They may
  join the amigo oculto with that first answer: the entries are saved, but the organizers' list,
  the draw and the other guests' list leave them out until the approval (only the guest sees
  their own). Relatives follow their guest. Guests from before it was turned on count.
- Relatives are always listed in kinship order: Cônjuge, Filho(a), Pai/Mãe, Avô/Avó, Irmão(ã),
  Parente, Pet, Outro; companions come last. The same in "Confirmados", "Levar familiares?" and
  "Minha família" (`sortByKinship`, the order of `RELATIONSHIP_OPTIONS`).
- Organizers see "Aguardando aprovação (N)" at the top of "Quem vai", each with **Aprovar**
  (`approved: true`) or **Recusar** (confirm dialog; removes the guest, their relatives and the
  amigo oculto entries they wrote; they may answer again and wait again).
- Rules: with approval on, a new answer must carry `approved: false`; a guest never changes
  `approved` on their own answer; a guest who confirmed (waiting or approved: the guest document
  exists) writes their amigo oculto entries. Not enforced:
  claims (the screen stops them) and Início, which still shows the invite as "Confirmado".

## The event page

- Creating an event opens its page (not the editor). Sharing the invite (link, QR code, WhatsApp)
  is on the event page, for organizers, right under the invitation; the editor only edits.
- The amigo oculto is one card: its settings, the participants and "Adicionar alguém à mão", then
  the draw. After the draw only the links and three short tips stay, and on a wide screen the card
  moves from beside the share panel to under "Confirmados", where the links have room.
- On a phone the bottom navigation (Início, Meus eventos, Perfil) shows on the event page too
  (`showsBottomNav`), so the page never ends in an empty strip.
- The event card's date line ("Quarta-feira, 30 de setembro · 19:30") and "Adicionar ao
  calendário" each stay on one line on a phone.
- Beside the share panel, the owner's top row has a scene for the event's theme
  (`app-event-ornament`, the same theme as the page background: Natal, casamento, churrasco…;
  a party with balloons when there is none). Its extra colours live in `tokens/_ornament.scss`.
- Section order: event card, share panel (organizers), RSVP card (not for the organizer), the family checklist, "Lista do
  evento" (hidden when the event has no items, to organizers too), **Quem vai**, "Amigo oculto" (organizers
  only, when the event has one; see [secret-santa](secret-santa.md)), Pix.
- "Eu levo" offers the member and only the relatives confirmed with them for this event.
- **Confirmados** (`buildGuestHouseholds`; "Quem vai" in older notes): the header says how many people are going ("8 confirmados").
  One panel per household, titled with the guest's name and a short summary ("+2 · 3 itens"); inside,
  "Convidado(a)" and what they bring, then each relative and companion with their role and a bulleted
  "Leva:" list. The first panel is open, and all of them up to three households.
- Organizers also see phones, "Não poderão ir" and the header icons **Baixar PDF** and
  **Imprimir**. The editor has no guest list.
- "Não poderão ir" looks like the list above it, quieter: a title with a neutral count pill, one
  row per person with a grey avatar and the name, and their note in italics under it.
- **Imprimir** prints a plain HTML document of the list (`buildGuestListDocument`, through a hidden
  iframe, `printHtmlDocument`); **Baixar PDF** builds a designed PDF with jsPDF (`guest-list-pdf.ts`,
  loaded only when tapped): lilac header, zebra rows, a "Chegou" box to tick at the door.
- "Faltam 5 kg" beside an item is lilac text, not a pill: it informs, "Eu levo" (soft amber) acts.

## Adding someone by hand

- In **Confirmados**, the organizers (owner and collaborators) have **"Adicionar alguém à mão"**:
  a drawer (`org-bottom-sheet`, as in the amigo oculto) with the name, WhatsApp (optional) and the
  companions' names (up to 10). For someone who will not answer the invite: the grandmother without
  a phone, a guest confirmed by a call.
- Saved as a guest in `events/{id}/guests` (random id) with `addedBy` (the organizer's uid) and no
  `uid`: no account behind it. Always confirmed and approved, even when the event asks for
  approval. It counts like any answer: Confirmados, the total, the PDF/print and the Pix split.
- **Nobody goes on the list twice.** Someone already confirmed (by the invite or by hand, or
  coming along with someone), found by `findSamePerson` (same name, or same phone and first
  name), only gets the alert "Já está na lista" and nothing is saved; the same goes for each
  companion typed. Editing someone never warns about themself.
- Typing the name offers the people typed by hand before (no account), in this event and the
  organizer's other events, with their phone (`KnownPeopleService`, as in the amigo oculto).
- The person shows like anyone else, with no "à mão" tag (it was dropped: it crowded the row).
  Organizers get **Editar** / **Remover** inside the household's panel; removing asks first.
- It is not linked to anyone's invite: it does not stop that person from confirming by the link
  later (they would show twice, and the organizer removes the hand-added entry), and it does not put
  them in the amigo oculto (that has its own "Adicionar alguém à mão").
- Rules: only `managesEvent` creates, edits and deletes these entries; the entry must keep
  `addedBy`, have no `uid`, a plain name up to 120 characters, an empty or valid phone and
  `companions` matching `companionsCount` (≤ 10). A guest cannot mark their own answer `addedBy`.

## Names follow the profile

A person with an account is shown everywhere by the name on their profile now, not the one typed
when they answered: the top bar and menu, Início, "Organizado por" (on the event and in the event
lists), the RSVP card, Confirmados, "Aguardando aprovação", "Não poderão ir", who brings each
item, the amigo oculto list and links, and the secret link's "Este link é de". The screens look
the name up by account (`publicProfiles/{uid}`); the copies saved before are only a fallback.

- A new draw writes the profile names into the links; a draw made before keeps its names until
  it is drawn again.
- Renaming yourself or a relative on the profile also rewrites the copies in every event the
  household answered (`rsvpEvents`): the guest entries, what each one brings, and the amigo oculto
  entries while that draw is still open. Relatives have no account to look up, so this is how
  their new name reaches the events. Best effort: an event that refuses the write keeps the old copy.
- Companions typed on an answer have no account and keep the name they were given.

## Organizer

- Saving an edited event goes back to Meus eventos.
- "Organizado por" shows the owner's profile name (`creatorName`), kept in step when the profile
  name changes; the owner sees "Você".
