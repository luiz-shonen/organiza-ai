/**
 * Secret santa ("amigo oculto"): the draw and the WhatsApp message that carries each link.
 */
import { Phone } from '../value-objects/phone';
import type {
  SecretSantaDraw,
  SecretSantaDuplicate,
  SecretSantaParticipant,
  SecretSantaParticipantInput,
} from '../models/secret-santa.model';

export interface SecretSantaPair<T> {
  readonly giver: T;
  readonly receiver: T;
}

/** A uniform random integer in [0, max), from Web Crypto when there is one. */
export function secureRandomInt(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // Rejection sampling: drop the values that would favour the lower numbers.
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buffer = new Uint32Array(1);
    do {
      crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Draws who gives a gift to whom: shuffles the people and has each one give to the next,
 * the last to the first. Nobody draws themself, and everyone gives and receives exactly once.
 * Needs at least two people.
 */
export function drawSecretSanta<T>(
  people: readonly T[],
  randomInt: (max: number) => number = secureRandomInt,
): SecretSantaPair<T>[] {
  if (people.length < 2) {
    throw new Error('O amigo oculto precisa de pelo menos duas pessoas.');
  }
  const order = [...people];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((giver, i) => ({ giver, receiver: order[(i + 1) % order.length] }));
}

/** The draw no longer matches the participants: someone was added or removed after it. */
export function isSecretSantaDrawOutdated(
  draw: Pick<SecretSantaDraw, 'participantIds'> | null,
  participantIds: readonly string[],
): boolean {
  if (!draw) return false;
  const drawn = new Set(draw.participantIds);
  return drawn.size !== participantIds.length || participantIds.some((id) => !drawn.has(id));
}

/** The secret link a participant opens to see whom they drew. */
export function buildSecretSantaRevealUrl(origin: string, token: string): string {
  return `${origin}/amigo-oculto/${token}`;
}

export interface SecretSantaShare {
  readonly name: string;
  readonly eventTitle: string;
  readonly url: string;
  /** Who organizes the event ("Luiz Rodrigues"): the person to ask for a new link. */
  readonly organizerName?: string;
}

/**
 * "Olá, Jéssica! ... toque no link". It says the link opens once and that whoever organizes
 * can make a new one (same person drawn). The link goes alone on the last line, and there is
 * no emoji, for the same reasons as the event invitation (see `buildShareMessage`).
 */
export function buildSecretSantaMessage({
  name,
  eventTitle,
  url,
  organizerName,
}: SecretSantaShare): string {
  const firstName = name.trim().split(/\s+/)[0] || name.trim();
  const organizer = organizerName?.trim().split(/\s+/)[0];
  const askWhom = organizer ? `a ${organizer}, que organiza o evento` : 'a quem organiza o evento';
  return [
    `Olá, *${firstName}*!`,
    `O sorteio do amigo oculto de *${eventTitle.trim() || 'nosso evento'}* foi feito.`,
    '',
    'Toque no link para descobrir quem você tirou. É segredo, não conte para ninguém!',
    '*Atenção:* o link só abre uma vez. Tenha papel e caneta para anotar o nome.',
    `Se precisar, peça um novo link ${askWhom}. Você continua com a mesma pessoa.`,
    url,
  ].join('\n');
}

/**
 * WhatsApp link that opens the chat with the participant (when the phone is valid) with the
 * message already typed; without a phone, WhatsApp asks whom to send it to.
 */
export function buildSecretSantaWhatsAppUrl(share: SecretSantaShare & { phone?: string }): string {
  const phone = Phone.create(share.phone);
  const to = phone ? `phone=55${phone.digits}&` : '';
  return `https://api.whatsapp.com/send?${to}text=${encodeURIComponent(buildSecretSantaMessage(share))}`;
}

/** Lower case, no accents, single spaces: "Jéssica  Melo" and "jessica melo" match. */
export function normalizePersonName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function firstName(name: string): string {
  return normalizePersonName(name).split(' ')[0] ?? '';
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * The id of an entry a guest writes from their RSVP: one per person, so answering again never
 * adds anyone twice. The rules only let account `uid` write ids that start with `rsvp_{uid}`.
 */
export function secretSantaRsvpId(
  uid: string,
  person: { familyId: string } | { companion: string } | null = null,
): string {
  if (!person) return `rsvp_${uid}`;
  if ('familyId' in person) return `rsvp_${uid}_f_${person.familyId}`;
  const slug = normalizePersonName(person.companion).replace(/[^a-z0-9]+/g, '-');
  return `rsvp_${uid}_c_${slug.replace(/^-|-$/g, '') || 'acompanhante'}`;
}

/**
 * People who are in the list twice: someone who joined from the RSVP and an entry the organizer
 * typed for the same person.
 *
 * - **Sure**: the same confirmed guest, or the same phone **and** the same first name. The phone
 *   alone is not enough: a grandmother may get her links on her daughter's phone, and the two
 *   are different people.
 * - **Doubtful**: the same full name with another phone (or none): pointed out, never joined,
 *   until the organizer says they are different people (`distinctFrom`).
 */
export function findSecretSantaDuplicates(
  participants: readonly SecretSantaParticipant[],
): SecretSantaDuplicate[] {
  const joined = participants.filter((p) => p.joinedBy);
  const typed = participants.filter((p) => !p.joinedBy);
  const used = new Set<string>();
  const found: SecretSantaDuplicate[] = [];
  const pair = (
    keep: SecretSantaParticipant,
    sure: boolean,
    match: (p: SecretSantaParticipant) => boolean,
  ) => {
    const drop = typed.find((p) => !used.has(p.id) && match(p));
    if (!drop) return false;
    used.add(drop.id);
    used.add(keep.id);
    found.push({ keep, drop, sure });
    return true;
  };
  for (const keep of joined) {
    const phone = phoneDigits(keep.phone);
    const first = firstName(keep.name);
    const sure =
      pair(keep, true, (p) => !!keep.guestId && p.guestId === keep.guestId) ||
      pair(
        keep,
        true,
        (p) => !!phone && phoneDigits(p.phone) === phone && firstName(p.name) === first,
      );
    if (!sure) {
      pair(
        keep,
        false,
        (p) =>
          normalizePersonName(p.name) === normalizePersonName(keep.name) &&
          !(keep.distinctFrom ?? []).includes(p.id),
      );
    }
  }
  return found;
}

/**
 * Who in the draw is the person being added by hand, if anyone: the same name (accents, case
 * and spaces aside; the stored one or, for an account, its profile name via `shownName`), or the
 * same phone **and** the same first name. The phone alone is not enough: a grandmother may share
 * her daughter's phone.
 */
export function findSecretSantaEntry<
  T extends Pick<SecretSantaParticipant, 'id' | 'name' | 'phone'>,
>(
  participants: readonly T[],
  person: { readonly name: string; readonly phone: string },
  shownName: (participant: T) => string = (participant) => participant.name,
): T | null {
  const name = normalizePersonName(person.name);
  if (!name) return null;
  const first = firstName(person.name);
  const phone = phoneDigits(person.phone);
  return (
    participants.find(
      (p) =>
        normalizePersonName(p.name) === name ||
        normalizePersonName(shownName(p)) === name ||
        (!!phone && phoneDigits(p.phone) === phone && firstName(p.name) === first),
    ) ?? null
  );
}

interface SecretSantaWindow {
  enabled: boolean;
  selfJoin?: boolean;
  drawDate?: string;
  drawnAt?: string;
}

/** The draw day starts at midnight in Brasília (UTC−3): sign-ups close then. */
export function secretSantaDrawDeadline(drawDate: string | null | undefined): Date | null {
  if (!drawDate || !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) return null;
  return new Date(`${drawDate}T00:00:00-03:00`);
}

/** Guests may still join or leave on their own: amigo oculto on, not drawn, draw day not come. */
export function isSecretSantaOpen(
  settings: SecretSantaWindow | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!settings?.enabled || settings.drawnAt) return false;
  const deadline = secretSantaDrawDeadline(settings.drawDate);
  return !deadline || now < deadline;
}

/** Guests may join the draw from the invite: open (above) and the owner has not closed it. */
export function isSecretSantaSelfJoinOpen(
  settings: SecretSantaWindow | null | undefined,
  now: Date = new Date(),
): boolean {
  return isSecretSantaOpen(settings, now) && settings?.selfJoin !== false;
}

/** A `Date` as the `YYYY-MM-DD` of that calendar day (local time). */
export function toDrawDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` back to a local `Date` at midnight, for the date field. */
export function fromDrawDate(drawDate: string | null | undefined): Date | null {
  if (!drawDate || !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) return null;
  const [y, m, d] = drawDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The entry id of one person a guest puts in the draw (`self`, `f:{id}` or `c:{name}`). */
export function rsvpSecretSantaEntryId(uid: string, key: string): string {
  if (key.startsWith('f:')) return secretSantaRsvpId(uid, { familyId: key.slice(2) });
  if (key.startsWith('c:')) return secretSantaRsvpId(uid, { companion: key.slice(2) });
  return secretSantaRsvpId(uid);
}

/**
 * The entries a guest writes from the invite. A relative or companion gets the WhatsApp typed for
 * them in the invite, else (a relative) the one in the family profile, else the guest's: then
 * their link goes to the guest's WhatsApp, with their own name.
 */
export function buildRsvpSecretSantaEntries(params: {
  readonly uid: string;
  readonly name: string;
  readonly phone: string;
  readonly familyMembers: readonly { id: string; name: string; phone?: string }[];
  readonly companions: readonly string[];
  readonly choice: Readonly<Record<string, readonly string[]>>;
  /** WhatsApp typed in the invite for a relative or companion, by key. */
  readonly phones?: Readonly<Record<string, string>>;
}): { id: string; input: SecretSantaParticipantInput }[] {
  const { uid, name, phone, familyMembers, companions, choice } = params;
  const typed = (key: string) => Phone.create(params.phones?.[key] ?? '')?.formatted;
  return Object.entries(choice).flatMap(([key, gifts]) => {
    const giftOptions = [...gifts];
    const id = rsvpSecretSantaEntryId(uid, key);
    if (key === 'self') {
      return [{ id, input: { name, phone, giftOptions, guestId: uid } }];
    }
    if (key.startsWith('f:')) {
      const member = familyMembers.find((m) => m.id === key.slice(2));
      if (!member) return [];
      const own = Phone.create(member.phone ?? '')?.formatted;
      return [
        {
          id,
          input: {
            name: member.name,
            phone: typed(key) || own || phone,
            giftOptions,
            guestId: `${uid}_${member.id}`,
          },
        },
      ];
    }
    const index = companions.indexOf(key.slice(2));
    if (index < 0) return [];
    return [
      {
        id,
        input: {
          name: companions[index],
          phone: typed(key) || phone,
          giftOptions,
          guestId: `${uid}#${index}`,
        },
      },
    ];
  });
}

/** A store where a gift idea can be looked up: its name, its mark and the search address. */
export interface GiftSearchLink {
  readonly store: 'Mercado Livre' | 'Amazon';
  readonly icon: string;
  readonly url: string;
}

/**
 * Searches for a gift idea ("Chinelo, cor verde, tamanho 36") on Mercado Livre and Amazon:
 * plain links that open each store's search, like "Adicionar ao calendário" opens Google's.
 */
export function giftSearchLinks(idea: string): GiftSearchLink[] {
  const text = idea.trim().replace(/\s+/g, ' ');
  if (!text) return [];
  return [
    {
      store: 'Mercado Livre',
      icon: '/icons/mercado-livre.svg',
      // Mercado Livre's own search pages read the words joined by hyphens.
      url: `https://lista.mercadolivre.com.br/${encodeURIComponent(text.replace(/ /g, '-'))}`,
    },
    {
      store: 'Amazon',
      icon: '/icons/amazon.svg',
      url: `https://www.amazon.com.br/s?k=${encodeURIComponent(text)}`,
    },
  ];
}
