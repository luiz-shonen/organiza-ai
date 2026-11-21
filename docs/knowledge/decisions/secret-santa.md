---
type: decision
title: Amigo oculto (secret santa)
status: active
date: 2026-11-16
enforced_by:
  - firestore.rules
  - e2e/rules/secret-santa.rules.test.ts
  - e2e/rules/secret-santa-self-join.rules.test.ts
  - e2e/tests/organizer/secret-santa-invite.spec.ts
  - src/app/core/utils/secret-santa-rsvp.utils.spec.ts
  - e2e/rules/notifications.rules.test.ts
  - e2e/tests/organizer/secret-santa.spec.ts
  - src/app/core/utils/secret-santa.utils.spec.ts
  - src/app/core/services/secret-santa.service.spec.ts
related: [events-and-invites.md, firebase-and-auth.md]
---

# Amigo oculto

An event can have an amigo oculto: a draw of who gives a gift to whom, kept secret from
everyone, the organizer included.

## Setting it up (editor, step "Amigo oculto", before Pix: settings only)

- "Vai ter amigo oculto?" and "Incluir opções de presente" are saved on the event as
  `secretSanta: { enabled, giftOptions, maxGiftOptions }`. With gift options on, the owner picks how
  many each person may list ("Quantas opções cada pessoa pode sugerir?", 1 to 10, 3 by default;
  the rules enforce the range). Only the owner changes these; collaborators see them locked.
- The editor step holds only these settings; its note says the guests join by themselves when
  they confirm, and that the participants, adding by hand and the draw are on the event page.

## Participants (event page, organizers who can still edit)

- Under the "Amigo oculto" card, `app-secret-santa-participants`: "Confirmados no evento" (confirmed
  guests and their companions not in yet, one tap, "Adicionar todos"), the list "Participantes" (N
  pessoas no sorteio, what is still missing for a draw, edit in a side sheet, remove with a
  confirmation, warning to draw again after a draw), then "Quem não vai entrar pelo convite" with
  the form behind "Adicionar alguém à mão" (it stays open to add several; "Fechar" folds it).
  Typing a name offers people from the organizer's other events and family.
- By hand the organizer types: name, phone (for WhatsApp, optional) and, when the event asks for
  them, gift options ("Chinelo, cor verde, tamanho 36"), up to the event's number. Lowering the
  number later keeps what participants already have. Hand entry stays: many people never open the
  site. Duplicates from both ways are joined as below.
- Guests may also join themselves from the invite (next section).

## Joining from the invite

- Confirming presence alone puts nobody in the draw; the RSVP drawer asks "Quem vai participar do
  sorteio?" with one checkbox for the guest and one for each relative and companion going, each
  with their gift options (one per line, up to the event's number).
- **Who a person is comes from the RSVP, never from the phone.** Each one gets a fixed entry id
  under the guest's account (`rsvp_{uid}`, `rsvp_{uid}_f_{familyId}`, `rsvp_{uid}_c_{name}`,
  `secretSantaRsvpId`), with `joinedBy: uid`; answering again updates it, never adds a second one.
  The phone is only where the link goes. Each relative or companion checked gets an optional
  "WhatsApp de {nome}" (filled from the family profile, or from what was typed before); without
  one the guest's is used (a grandmother's link on her daughter's WhatsApp, with "Olá, Ana!"), so
  two people may share it.
- "Não poderei ir" offers "Mesmo sem ir, quero participar do amigo oculto" (phone and gift options);
  after declining, the card shows "Quero participar só do amigo oculto" or "Sair do amigo oculto".
  Cancelling a presence takes the relatives and companions out with it.
- A guest cannot read the list (it holds phones): they read their own entries one by one, by id.
- The owner closes the sign-ups on the event page ("Convidados podem entrar pelo convite",
  `secretSanta.selfJoin: false`), for instance after the draw; then the invite only says they are
  closed and nobody joins or leaves alone. The editor keeps that choice when it saves the event.
- Rules: an account writes, reads and deletes only ids `rsvp_{its uid}…` whose `joinedBy` is its
  uid (an entry typed by the organizer under such an id stays theirs), only while amigo oculto is
  on and sign-ups are open, and never sets `distinctFrom`. Nobody changes `joinedBy` afterwards.

## The same person twice (`findSecretSantaDuplicates`)

A person typed by hand may later join from the invite. Pairs are always an entry from the invite
(kept: it is tied to the account) and one typed by an organizer:

- **Sure**: the same confirmed guest, or the same phone **and** the same first name (accents and
  case ignored: "Jessica" and "Jéssica Melo"). The event page of any organizer joins them at once
  (`mergeDuplicate`): the typed entry leaves, its phone and gift options fill what the other lacks.
- The phone alone never matches: daughter and grandmother share one and stay two people.
- **Doubtful**: the same full name with another phone, or none. The card shows "Possível
  repetido: … (adicionado à mão) e … (entrou pelo convite)" with **Juntar** and "São pessoas
  diferentes" (`distinctFrom` on the kept entry, so it is not pointed out again).
- A merge after the draw changes the list, so the usual "A lista mudou depois do sorteio" shows.
- Participants live in `events/{id}/secretSantaParticipants`; the owner and collaborators manage
  them (they hold phones, so nobody else reads them). While creating, they are drafts saved right
  after the event, like the items.

## The reveal page looks like an invitation

- `/amigo-oculto/:token` is on invitation paper (`app-invite-paper`, palette `segredo`), in the
  formal words of the invitations: first the sealed envelope ("Envelope lacrado", "Este link é
  de" and the name, then the plain warning and "Sou Ana, mostrar"); then "Salve, Ana!", "Por
  decreto da sorte, coube a Vossa Senhoria presentear", the name drawn in large engraved type,
  and "Guardai segredo até a troca de presentes", with confetti. The "abre uma vez" warning,
  the gift ideas and the buttons stay plain, outside the paper; so do the expired and locked
  states.

## The draw (event page, card "Amigo oculto", organizers only)

- Only the **owner** draws and draws again; a collaborator sees "Só quem criou o evento faz o sorteio".
- The draw needs at least 3 participants (`SECRET_SANTA_MIN_PARTICIPANTS`): with 2, each would know.
- `drawSecretSanta` shuffles with Web Crypto and makes one cycle: each person gives to the next, so
  nobody draws themself and everyone gives and receives once.
- One batch writes each pair to `secretSantaReveals/{token}` (a random UUID from `generateId`,
  never a name), and the list of links (name, phone, token and the receiver's **id**, never the
  name) to `events/{id}/secretSanta/draw`, readable by the owner only. The owner's screen shows whom
  to send each link to, never who drew whom. The receiver id is there only for "Novo link"; an owner
  digging through the database could match it to a name, which is accepted without a server.
- Each row says "Ainda não abriu" or "Abriu em 16/11, às 20:49" (live, from `openedAt`), and the
  card counts "1 de 3 já abriram".
- "Novo link" (confirm dialog) replaces one person's link with a new token for the same pair, read
  from the current participants: for someone who opened it without writing the name down, or lost
  the message. The old link stops working; everyone else keeps theirs. It fails, asking for a new
  draw, when that person or whom they drew left the list.
- "Sortear de novo" asks first (danger dialog): the old reveal documents are deleted in the same
  batch, so old links show "Link não encontrado… peça o novo link"; every participant gets a new link.
- Adding or removing a participant after the draw shows "A lista de participantes mudou depois do
  sorteio" (`isSecretSantaDrawOutdated`); the editor warns too.
- "WhatsApp" opens `api.whatsapp.com/send?phone=55…&text=…` (no `phone` when the participant has
  none): "Olá, _Jéssica_! O sorteio do amigo oculto de _Natal 2026_ foi feito…" with the link alone on
  the last line and no emoji, for the reasons in `buildShareMessage`.

## Told in the app too (participants with an account)

- A participant added from "Confirmados no evento" keeps the guest id, and a guest who joined
  themself from the invite is their own account (`rsvp_{uid}`); when there is an account
  (`guest.uid`, or `joinedBy`), the draw also writes a notice to their inbox
  `users/{uid}/notifications/secret-santa_{eventId}`: "Sorteio do amigo oculto feito!", "Ver quem
  eu tirei", pointing to **their** secret link. "Novo link" replaces it with "Seu novo link do
  amigo oculto". One notice per event, so a redraw or a new link never leaves a stale one.
  Relatives, companions and people typed by hand have no account of their own: WhatsApp only.
- **WhatsApp stays the main way**: many participants never open the app. Notices are best effort
  and never fail the draw; the owner's list says "Avisado(a) no app" per person.
- The member sees new notices at the top of **Início** (`app-notification-card`, ✕ dismisses) and,
  on the event page, a card with the same action; once read it says "Você já abriu seu resultado…
  peça um novo link". Opening the result (from the notice, or from the WhatsApp link while signed
  in) marks the notice read. It is the same one-time link, so opening it in either place spends it.
- Rules: only the member reads, marks read (`readAt` only) and deletes their inbox; only the
  owner of `eventId` writes a `secret-santa_{eventId}` notice, new, with plain text and an
  `/amigo-oculto/…` action.

## The secret link (`/amigo-oculto/:token`)

Against a forwarded link (someone passes theirs on before opening it):

- **"Sou a Ana, mostrar".** The page first says whose link it is ("Este link é de Ana Souza … Se
  você não é Ana, não toque no botão") and shows or spends nothing until that tap. It stops the
  common accidents (a grandson tapping grandma's link, a message forwarded to the family group),
  not someone set on peeking.
- **Links of an account open only in it.** A participant with an account (joined from the invite,
  or added from a confirmed guest who answered with one) gets `giverUid` on the reveal; the rules
  let only that account (and the event owner, for "Abriu em…") read and spend it. Signed in to it,
  the page does not ask "Sou a Ana". Anyone else sees "Este link é pessoal" with "Entrar". People
  without an account (typed by hand) still open it without signing in.
- **A leak shows, and the answer is a new draw.** The link opens once, so the real person sees
  "Este link já foi aberto … Não foi você que abriu? … o sorteio precisa ser feito de novo", and the
  owner's card says: if a link shows as opened and the person says it was not them, draw again.
  "Novo link" keeps the same pair, so it does not fix a leak.

- Opens **without signing in**: many participants are elderly and only get the link by WhatsApp.
  The rules allow `get` on `secretSantaReveals/{token}` to anyone and never `list`, so a link is only
  as guessable as its UUID. A signed-in account sees exactly the same page.
- Opening the link is the reveal: it greets by first name ("Olá, Jéssica!"), names the event, and
  celebrates at once (`ConfettiService.fireCelebration`: a burst from the middle and streams from
  both sides, skipped under `prefers-reduced-motion`) while the name pops in, in large type inside a
  highlighted box, with "Sugestões de presente" below. "Esconder" covers it when someone is looking;
  "Mostrar de novo" brings it back with another party. Large type and few buttons on purpose.
- **A link opens once.** Opening stamps `openedAt` and erases `receiverName` and the gift options
  from the document at once (`openReveal`); the rules allow that change once, to anyone holding the
  link, and nothing else. The name stays on the screen until it is closed, under an amber warning:
  "Este link só abre uma vez. Anote num papel o nome de quem você tirou…". The WhatsApp message
  warns too. A second visit shows "Este link já foi aberto", when, and "peça um novo link para quem
  organiza o evento". If the opening cannot be saved for another reason (no connection), the name
  is still shown rather than lost.
- Without a server, "once" is enforced by the app and the data is gone after the first opening;
  someone calling the API directly could read an unopened link without spending it.
- Requiring the participant's own account to see the result is the stricter option, left for later.
