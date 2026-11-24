/** "Vai ter amigo oculto?": saved on the event by its owner. */
export interface SecretSantaSettings {
  readonly enabled: boolean;
  /** Each participant may list gift options ("Chinelo, cor verde, tamanho 36"). */
  readonly giftOptions: boolean;
  /** How many options each participant may list, chosen by the organizer (1 to 10). */
  readonly maxGiftOptions?: number;
  /**
   * Guests may put themselves in the draw from the invite ("Vai participar do amigo oculto?").
   * Missing means open; the owner closes it, for instance after the draw.
   */
  readonly selfJoin?: boolean;
  /**
   * The day of the draw (`YYYY-MM-DD`), chosen when creating the event. Guests join and leave
   * on their own until that day starts (Brasília time).
   */
  readonly drawDate?: string;
  /** When the owner drew: from then on the guests no longer join or leave on their own. */
  readonly drawnAt?: string;
}

/** Someone who takes part in the draw; not necessarily a guest with an account. */
export interface SecretSantaParticipant {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly giftOptions: readonly string[];
  /** The confirmed guest this participant was added from, if any. */
  readonly guestId?: string;
  /**
   * The account that put this person in the draw from its own RSVP ("Vou participar do amigo
   * oculto"): the guest themself, a relative or a companion. Empty for people the organizer added.
   */
  readonly joinedBy?: string;
  /** Entries the organizer said are other people with the same name ("São pessoas diferentes"). */
  readonly distinctFrom?: readonly string[];
  readonly createdAt?: string;
}

export type SecretSantaParticipantInput = Omit<
  SecretSantaParticipant,
  'id' | 'createdAt' | 'joinedBy' | 'distinctFrom'
>;

/**
 * Who a guest can put in the draw from the invite, by key: `self`, `f:{familyMemberId}` for a
 * relative, `c:{companion name}` for a companion.
 */
export type RsvpSecretSantaKey = string;

/** What the invite needs to ask "Quem vai participar do amigo oculto?". */
export interface RsvpSecretSantaData {
  /** Sign-ups from the invite are open; closed, the guest only reads where they stand. */
  readonly open: boolean;
  /** The guest may still take themself out: true until the draw (or its day) comes. */
  readonly canLeave?: boolean;
  /** Closed for this guest because the owner has not approved their presence yet. */
  readonly waitingApproval?: boolean;
  readonly giftOptions: boolean;
  readonly maxGiftOptions: number;
  /** Who is in the draw already, with their gift options. */
  readonly joined: Readonly<Record<RsvpSecretSantaKey, readonly string[]>>;
  /** The WhatsApp typed for a relative or companion before (not the guest's own fallback). */
  readonly phones?: Readonly<Record<RsvpSecretSantaKey, string>>;
}

/** Who the guest puts in the draw, with each one's gift options. */
export type RsvpSecretSantaChoice = Readonly<Record<RsvpSecretSantaKey, readonly string[]>>;

/**
 * The same person in the list twice: someone who joined from the RSVP (`keep`) and an entry the
 * organizer typed (`drop`). `sure` pairs are joined by the app; the others are only pointed out.
 */
export interface SecretSantaDuplicate {
  readonly keep: SecretSantaParticipant;
  readonly drop: SecretSantaParticipant;
  readonly sure: boolean;
}

/** One secret link per participant: only the event owner can read these. */
export interface SecretSantaLink {
  readonly participantId: string;
  readonly name: string;
  readonly phone: string;
  /** Random UUID: the link cannot be guessed from a name. */
  readonly token: string;
  /**
   * Whom this participant drew, by id, so the owner can send a new link after the first one
   * was opened (opening erases the name). The screens never show it.
   */
  readonly receiverId: string;
  /** The participant's account (a confirmed guest), told in the app as well as by WhatsApp. */
  readonly uid?: string;
}

/** The latest draw of an event (`events/{id}/secretSanta/draw`). */
export interface SecretSantaDraw {
  readonly drawnAt: string;
  readonly participantIds: readonly string[];
  readonly links: readonly SecretSantaLink[];
}

/** What one link reveals (`secretSantaReveals/{token}`), readable by whoever has the token. */
export interface SecretSantaReveal {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly eventDate: string;
  readonly giverName: string;
  /**
   * The giver's account, when they have one: the link then opens only signed in to it, so a
   * forwarded link shows nothing. Missing for people without an account (opened by anyone).
   */
  readonly giverUid?: string;
  readonly receiverName: string;
  readonly receiverGiftOptions: readonly string[];
  readonly createdAt: string;
  /** Set the first time the link is opened; from then on the link is spent. */
  readonly openedAt?: string;
}

/** One person in the amigo oculto as the guests see it: no phone, only the name and the ideas. */
export interface SecretSantaRosterEntry {
  readonly id: string;
  readonly name: string;
  readonly giftOptions: readonly string[];
}

/** Fewer people than this and everyone could guess who drew whom. */
export const SECRET_SANTA_MIN_PARTICIPANTS = 3;
/** Gift options per participant. */
export const SECRET_SANTA_MAX_GIFT_OPTIONS = 10;
/** Gift options per person when the organizer has not chosen another number. */
export const SECRET_SANTA_DEFAULT_GIFT_OPTIONS = 3;
