---
type: decision
title: Amigo oculto (secret santa)
status: active
date: 2026-11-16
updated: 2026-11-23
enforced_by:
  - firestore.rules
  - e2e/rules/secret-santa.rules.test.ts
  - e2e/rules/secret-santa-self-join.rules.test.ts
  - e2e/rules/approval-and-reveal-account.rules.test.ts
  - e2e/rules/notifications.rules.test.ts
  - e2e/tests/organizer/secret-santa-invite.spec.ts
  - e2e/tests/organizer/secret-santa.spec.ts
  - src/app/core/utils/secret-santa-rsvp.utils.spec.ts
  - src/app/core/utils/secret-santa.utils.spec.ts
  - src/app/core/services/secret-santa.service.spec.ts
  - src/app/features/event-detail/components/secret-santa-card/secret-santa-card.component.spec.ts
  - src/app/features/event-detail/components/secret-santa-roster-card/secret-santa-roster-card.component.spec.ts
  - src/app/features/secret-santa/secret-santa-reveal.container.spec.ts
related: [events-and-invites.md, firebase-and-auth.md]
---

# Amigo oculto

An event can have an amigo oculto: a draw of who gives a gift to whom, kept secret from
everyone, the organizer included.

## Setting it up (editor, step "Amigo oculto", before Pix: settings only)

- "Vai ter amigo oculto?" and "Incluir opções de presente" are saved on the event as
  `secretSanta: { enabled, giftOptions, maxGiftOptions, drawDate? }`. With gift options on, the
  owner picks how many each person may list (1 to 10, 3 by default; the rules enforce the range).
  Only the owner changes these; collaborators see them locked.
- **Dia do sorteio** (`drawDate`, `YYYY-MM-DD`, optional): from that day (midnight in Brasília)
  guests no longer join or leave alone, and only from that day the owner can draw (below).
- "Como funciona" is a numbered list (the guests join when they confirm; participants, adding by
  hand and the draw are on the event page).

## Whose entry is it

- **An entry from the invite belongs to the guest.** Entries a guest made (`joinedBy`) or tied to
  a confirmed guest (`guestId`) are changed only by that guest: name, phone and gift ideas. The
  organizer sees them with a "pelo convite" tag instead of the pencil, and may only remove them.
  The rules refuse an organizer's change to such an entry (`changesGuestEntry`), except marking a
  pair distinct and the phone a merge takes (below).
- **The organizer edits only the people they added by hand.**
- Names follow the profile: an account's own entry shows its profile name everywhere (see
  [events-and-invites](events-and-invites.md#names-follow-the-profile)).

## Participants (event page, organizers who can still edit)

- Under the "Amigo oculto" card, `app-secret-santa-participants`: "N pessoas no sorteio" and one row
  per person (name, phone, and "Ver 2 ideias de presente" that unfolds the ideas with icons), then
  **Adicionar alguém à mão**, which opens a sheet (`org-bottom-sheet`: from the side on a wide
  screen, from the bottom on a phone) with name, phone and, when the event asks for them, the gift
  ideas (`app-gift-options-field`, one at a time). There is no "Confirmados no evento" shortcut:
  confirmed guests join themselves from the invite.
- Typing a name offers people from the organizer's other events and family.
- Adding someone who seems to be there already (`sameSecretSantaPerson`) asks first: someone added
  by hand can be replaced or kept as another person; someone who joined from the invite can only
  be added as another person (their entry is theirs).
- Hand entry stays: many people never open the site.

## What guests see (`secretSantaRoster`)

- The participants hold phones, so only organizers read them. Guests read a roster beside them,
  `events/{id}/secretSantaRoster/{same id}`: only `name`, `giftOptions` and `createdAt`. Any
  signed-in account reads it; organizers write any entry (mirroring the participant,
  `mirrorsGuestEntry`); a guest writes only `rsvp_{uid}…` entries, in the same batch as their
  participant entry (the rules check it with `getAfter`).
- Every write to a participant writes its roster entry in the same batch; `syncRoster` fixes drift
  when an organizer opens the page.
- The guest's invite has an **"Amigo oculto"** card at the bottom: who is in, with their ideas, no
  phones. On their own entries a pencil opens the same form the organizer uses (in a sheet), with
  **Sair do amigo oculto**. A confirmed guest not in yet gets **Participar do amigo oculto** there.
  While their presence waits for approval the card says their entry counts once approved.

## Joining from the invite

- Asked **once, at the first confirmation**: the RSVP drawer ("Confirme seus dados") asks "Quem vai
  participar do sorteio?" with a checkbox for the guest and one per relative and companion going,
  each with their WhatsApp and gift ideas. **Editar presença does not ask again**: from then on the
  guest edits or leaves in the "Amigo oculto" card.
- **Who a person is comes from the RSVP, never from the phone.** Each one gets a fixed entry id
  under the guest's account (`rsvp_{uid}`, `rsvp_{uid}_f_{familyId}`, `rsvp_{uid}_c_{name}`,
  `secretSantaRsvpId`), with `joinedBy: uid`; answering again updates it, never adds a second one.
  The phone is only where the link goes; without one, a relative's link goes to the guest's.
- "Não poderei ir" offers to take part anyway; cancelling a presence takes the relatives and
  companions out with it.
- The owner closes sign-ups on the event page ("Convidados podem entrar pelo convite",
  `secretSanta.selfJoin: false`); then nobody joins or leaves alone. The draw closes them too.
- With approval on (see [events-and-invites](events-and-invites.md)), a guest waiting for it may
  join at the first confirmation; the organizers' list, the draw and others' roster leave those
  entries out (`pendingSantaUids`) until the approval, and a refusal deletes them.
- Rules: an account writes, reads and deletes only ids `rsvp_{its uid}…` whose `joinedBy` is its
  uid, only while amigo oculto is on, sign-ups are open, the draw day has not come and there is no
  draw, and never sets `distinctFrom`. Nobody changes `joinedBy` afterwards.

## The same person twice (`findSecretSantaDuplicates`)

A person typed by hand may later join from the invite. Pairs are always an entry from the invite
(kept: it is tied to the account) and one typed by an organizer:

- **Sure**: the same confirmed guest, or the same phone **and** the same first name (accents and
  case ignored). Joined at once (`mergeDuplicate`).
- The phone alone never matches: daughter and grandmother share one and stay two people.
- **Doubtful**: the same full name with another phone, or none. The card shows "Possível
  repetido: … (adicionado à mão, phone) e … (entrou pelo convite, phone)" with **Juntar** and
  "São pessoas diferentes"; either answer hides the notice.
- **Juntar** with two different phones asks "Qual telefone fica?". Keeping the typed one writes it
  on the guest's entry with `mergedFrom: <typed id>`; the rules allow that one change only when the
  typed entry is deleted in the same batch and its phone is the new one (`takesPhoneFromMerged`).
- A merge after the draw changes the list, so "A lista mudou depois do sorteio" shows.

## The draw (event page, card "Amigo oculto")

- Only the **owner** draws and draws again; at least 3 participants
  (`SECRET_SANTA_MIN_PARTICIPANTS`).
- **Not before the draw day.** With a `drawDate`, "Sortear amigo oculto" stays disabled with "O
  sorteio fica liberado a partir de 20 de dezembro, o dia escolhido no evento." The rules refuse
  creating the draw, or changing its `drawnAt`, before that day (03:00 UTC); "Novo link" for one
  person (same `drawnAt`) still works. Without a date, any time.
- `drawSecretSanta` shuffles with Web Crypto into one cycle. One batch writes each pair to
  `secretSantaReveals/{token}` (random UUID) and the list of links (name, phone, token, the
  receiver's id, the account `uid` when there is one) to `events/{id}/secretSanta/draw`, owner only.
  The names written are the **profile** names (`secretSantaParticipantsView`).
- **After the draw the card shows only what matters now**: no sign-up switch, no list, no
  duplicates. "Sorteio feito em 23 de novembro, às 16:56. 0 de 5 já abriram o link." and three tips
  (send each their link; lost it → "Novo link", same result; opened but not by them → draw again),
  then one row per person: name (profile name), phone, "Ainda não abriu" / "Abriu em…",
  "Avisado(a) no app", **Novo link**, **Copiar**, **Enviar no WhatsApp**.
- "Novo link" asks: "Com o novo link, Jéssica pode ver de novo quem tirou (a mesma pessoa). O link
  antigo para de funcionar." "Sortear de novo" asks in a danger dialog; old reveals are deleted.
- WhatsApp stays the main way to send links.

## Told in the app too (participants with an account)

- A participant with an account (`guest.uid` or `joinedBy`) also gets
  `users/{uid}/notifications/secret-santa_{eventId}` ("Sorteio do amigo oculto feito!" / "Seu novo
  link do amigo oculto", "Ver quem eu tirei"). One notice per event.
- It shows at the top of **Início**, in the bell and on the event page. In the bell it carries the
  organizer's photo and name ("Natal · por Jéssica"), read live from their profile. The notice
  card's icon takes its box's colour (white on purple, dark on lilac in the dark theme).
- Opening the result (from the notice, or the WhatsApp link while signed in) marks it read; it is
  the same one-time link.

## The secret link (`/amigo-oculto/:token`)

Every state is invitation paper (`app-invite-paper`, palette `segredo`, class `reveal__envelope`)
with its gold frame and corner scrolls, **at least as tall as the screen under the top bar and
never scrolling** when there is nothing more to read (only gift ideas, below the result, scroll).

- **Envelope lacrado**: "Este link é de" and the name (the giver's **profile** name when the link
  has `giverUid`), then two lines, one sentence each: "O resultado aparece uma vez só, então anote o
  nome." / "Se você não é Jéssica, não abra: devolva o link para quem enviou." and **Sou Jéssica,
  mostrar**. Nothing is spent before that tap. A signed-in giver is not asked.
- **The result** is the moment of the page: "Salve, Jéssica!", "Por decreto da sorte, coube a Vossa
  Senhoria presentear", then the name, large, landing from a blur into a gold glow with stars
  twinkling around it, confetti, and a short fanfare made with Web Audio (`celebration-sound.ts`,
  no file; timed to the name, `CELEBRATION_SOUND_DELAY_MS`; silent where the browser does not allow
  sound). "Guardai segredo até a troca de presentes.", then, on the paper, the note "**Este link só
  abre uma vez.** Anote o nome antes de fechar a tela." between two fine gold rules (not an amber
  box), and **Esconder** / **Ver o evento**. Gift ideas, with Mercado Livre and Amazon searches,
  follow below the paper.
- **Em segredo** (after Esconder): the same paper with **Mostrar de novo** and the same note.
- **Este link já foi aberto**: "Olá, Jéssica!", a purple wax seal with a lock, when it was opened,
  "peça um novo link para quem organiza o evento" and "Não foi você que abriu? Então alguém viu o
  seu resultado: avise quem organiza, que o sorteio precisa ser feito de novo." + **Ver o evento**.
- **Este link é pessoal** (the link of another account): seal with a lock, and **Entrar** when not
  signed in.
- **Link não encontrado** ("Envelope extraviado", a broken-link seal): a redrawn or replaced link.
- **Sizes follow the screen**: type and spacing scale with the screen's smaller side (`vmin`), and
  on short windows the paper tightens in steps: below 780px high less margin; below 620px (700px
  on a phone) a smaller seal and heading and closer lines; below 540px (600px on a phone) no seal
  and no divider. Checked with no scroll from 1200×500 to 1920×1080 and on phones 600–760px high.
- `prefers-reduced-motion`: no glow, stars or name animation; the sound still plays.

### What protects a link

- Opens **without signing in** (elderly participants get it by WhatsApp); `get` on
  `secretSantaReveals/{token}` is allowed to anyone, `list` never.
- **Links of an account open only in it** (`giverUid`): anyone else sees "Este link é pessoal".
- **A link opens once.** Opening stamps `openedAt` and erases the receiver's name and ideas
  (`openReveal`); the rules allow that change once. A second visit shows "Este link já foi aberto".
  If saving fails for another reason (no connection), the name still shows.
- **A leak shows, and the answer is a new draw**: the real person sees "already opened"; "Novo
  link" keeps the same pair, so it does not fix a leak.
- Without a server, "once" is enforced by the app; someone calling the API directly could read an
  unopened link without spending it.
