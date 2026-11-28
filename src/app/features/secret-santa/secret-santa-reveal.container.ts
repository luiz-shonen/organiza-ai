import { LinkedTextComponent } from '../../shared/components/linked-text/linked-text.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  ConfettiService,
  InboxService,
  SecretSantaService,
  UserService,
} from '../../core/services';
import { secretSantaNotificationId, type SecretSantaReveal } from '../../core/models';
import { giftSearchLinks } from '../../core/utils/secret-santa.utils';
import { explainError } from '../../core/utils';
import {
  FeedbackService,
  OrgButtonComponent,
  OrgIconComponent,
  OrgLoadingStateComponent,
  OrgPageLayoutComponent,
} from '../../shared/ui';
import {
  InviteDividerComponent,
  InvitePaperComponent,
} from '../../shared/components/invite-paper/invite-paper.component';
import { CELEBRATION_SOUND_DELAY_MS, playCelebrationSound } from './celebration-sound';

/**
 * The secret link of the amigo oculto (`/amigo-oculto/:token`). Opens without signing in,
 * because many participants (grandparents included) only get the link by WhatsApp.
 *
 * Both steps are on invitation paper (`app-invite-paper`), in formal words like the invitations.
 * Against a forwarded link: the page first says whose link it is ("Este link é de Ana") and shows
 * nothing until they tap "Sou a Ana, mostrar"; a participant with an account must be signed in to
 * it (the rules refuse anyone else), and is not asked. Then the reveal: a celebration with
 * confetti, the name they drew in large type, and the gift options below. "Esconder" covers it
 * (someone looking); "Mostrar de novo" brings it back. The link opens once: a warning asks to
 * write the name down, and a second visit says the link expired and to ask for a new one.
 */
function isPermissionError(error: unknown): boolean {
  return /permission|insufficient/i.test(String((error as Error)?.message ?? error));
}

@Component({
  selector: 'app-secret-santa-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InviteDividerComponent,
    LinkedTextComponent,
    InvitePaperComponent,
    NgTemplateOutlet,
    OrgButtonComponent,
    OrgIconComponent,
    OrgLoadingStateComponent,
    OrgPageLayoutComponent,
  ],
  templateUrl: './secret-santa-reveal.container.html',
  styleUrl: './secret-santa-reveal.container.scss',
})
export class SecretSantaRevealContainer {
  public readonly token = input.required<string>();
  /** Little stars twinkling around the name they drew (percent of its box, and a delay). */
  protected readonly sparks = [
    [4, 18, 0],
    [94, 12, 0.4],
    [12, 82, 0.8],
    [88, 78, 0.2],
    [50, -6, 0.6],
    [30, 100, 1],
    [70, 96, 0.3],
  ].map(([x, y, d]) => ({ x, y, delay: `${d + 1.6}s` }));

  /** "Mercado Livre" and "Amazon" searches for a gift idea. */
  protected readonly searchLinks = giftSearchLinks;

  private readonly secretSantaService = inject(SecretSantaService);
  private readonly confetti = inject(ConfettiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly inbox = inject(InboxService);
  private readonly users = inject(UserService);
  private readonly feedback = inject(FeedbackService);

  protected readonly loading = signal(true);
  protected readonly reveal = signal<SecretSantaReveal | null>(null);
  protected readonly revealed = signal(false);
  /** The link was already opened once: it no longer shows whom the person drew. */
  protected readonly expired = signal(false);
  /** "Sou a Ana, mostrar": shown before anything is spent or revealed. */
  protected readonly confirming = signal(false);
  protected readonly opening = signal(false);
  /** The link belongs to another account: the rules did not let this one read it. */
  protected readonly locked = signal(false);
  protected readonly signedIn = computed(() => {
    const user = this.auth.currentUser();
    return !!user && !user.isAnonymous;
  });

  protected readonly firstName = computed(() => {
    const name = this.reveal()?.giverName?.trim() ?? '';
    return name.split(/\s+/)[0] || name;
  });

  /** A link of the account signed in here: it opens in it as often as they like. */
  protected readonly ownAccountLink = computed(() => {
    const giverUid = this.reveal()?.giverUid;
    return !!giverUid && this.signedIn() && this.auth.currentUser()?.uid === giverUid;
  });

  /** "O que Leonardo quer ganhar": the first name of who they drew. */
  protected readonly receiverFirstName = computed(() => {
    const name = this.reveal()?.receiverName?.trim() ?? '';
    return name.split(/\s+/)[0] || name;
  });

  /** A store's search opens in a new tab, keeping the result on this one. */
  protected openStore(event: MouseEvent, url: string): void {
    event.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** "16 de novembro, às 20:49", when the link was opened; '' when unknown. */
  protected readonly openedLabel = computed(() => {
    const iso = this.reveal()?.openedAt;
    const date = new Date(iso ?? '');
    if (!iso || isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day}, às ${time}`;
  });

  /** Waits for the session: a link of an account only reads once it is known who is signed in. */
  private readonly load = effect(() => {
    const token = this.token();
    if (this.auth.loading()) return;
    const uid = this.signedIn() ? (this.auth.currentUser()?.uid ?? null) : null;
    this.loading.set(true);
    this.revealed.set(false);
    this.expired.set(false);
    this.confirming.set(false);
    this.locked.set(false);
    void this.open(token, uid).finally(() => this.loading.set(false));
  });

  /** Reads the link; nothing is spent until the person says it is theirs. */
  private async open(token: string, uid: string | null): Promise<void> {
    let reveal: SecretSantaReveal | null;
    try {
      reveal = await this.secretSantaService.getReveal(token);
    } catch (error) {
      this.reveal.set(null);
      this.locked.set(isPermissionError(error));
      return;
    }
    if (reveal) {
      // Names, ideas and the event read now: a newer link keeps only ids.
      reveal = await this.secretSantaService.describeReveal(reveal).catch(() => reveal);
    }
    if (reveal?.giverUid) {
      // Named as the account's profile is now, not as it was when the draw was made.
      const name = await this.users.publicName(reveal.giverUid).catch(() => '');
      if (name) reveal = { ...reveal, giverName: name };
    }
    this.reveal.set(reveal);
    if (!reveal) return;
    const own = !!reveal.giverUid && reveal.giverUid === uid;
    // A link of an account opens in it as often as they like (it keeps the result).
    if (reveal.openedAt && own && reveal.receiverName) {
      this.show();
      return;
    }
    if (reveal.openedAt) {
      this.expired.set(true);
      return;
    }
    // Signed in to the giver's own account: it is them, no need to ask.
    if (own) {
      await this.spend(token, reveal);
      return;
    }
    this.confirming.set(true);
  }

  /** "Sou a Ana, mostrar". */
  protected async confirm(): Promise<void> {
    const reveal = this.reveal();
    if (!reveal || this.opening()) return;
    this.opening.set(true);
    try {
      await this.spend(this.token(), reveal);
    } finally {
      this.opening.set(false);
      this.confirming.set(false);
    }
  }

  /**
   * Spends the link: from now on it only says it expired. The name stays on this screen until
   * it is closed, with a warning to write it down.
   */
  private async spend(token: string, reveal: SecretSantaReveal): Promise<void> {
    try {
      await this.secretSantaService.openReveal(token, !!reveal.giverUid, !!reveal.giverId);
      this.markNoticeRead(reveal.eventId);
    } catch (error) {
      // Opened elsewhere a moment ago. Any other failure (no connection) still shows the name.
      if (isPermissionError(error)) {
        this.expired.set(true);
        return;
      }
    }
    this.show();
  }

  /** A spent link of someone without an account: "Gerar novo link" makes one, same person. */
  protected readonly canRenew = computed(() => this.expired() && !this.reveal()?.giverUid);
  protected readonly renewing = signal(false);

  protected async renew(): Promise<void> {
    if (!this.canRenew() || this.renewing()) return;
    this.renewing.set(true);
    try {
      const fresh = await this.secretSantaService.renewLink(this.token());
      void this.router.navigate(['/amigo-oculto', fresh]);
    } catch (error) {
      this.feedback.error(explainError('Não foi possível gerar um novo link', error));
    } finally {
      this.renewing.set(false);
    }
  }

  protected signIn(): void {
    void this.router.navigate(['/login'], {
      queryParams: { redirect: `/amigo-oculto/${this.token()}` },
    });
  }

  /** Signed in and also told in the app: the notice of this event is done. Best effort. */
  private markNoticeRead(eventId: string): void {
    const user = this.auth.currentUser();
    if (!user || user.isAnonymous) return;
    this.inbox.markRead(user.uid, secretSantaNotificationId(eventId)).catch(() => undefined);
  }

  protected show(): void {
    this.revealed.set(true);
    this.confetti.fireCelebration();
    // The fanfare lands with the name; the tap that got here lets the page play sound.
    playCelebrationSound(CELEBRATION_SOUND_DELAY_MS);
  }

  protected hide(): void {
    this.revealed.set(false);
  }

  protected openEvent(): void {
    const eventId = this.reveal()?.eventId;
    if (eventId) void this.router.navigate(['/evento', eventId]);
  }
}
