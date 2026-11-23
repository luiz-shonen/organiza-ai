import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  SECRET_SANTA_MIN_PARTICIPANTS,
  type SecretSantaDuplicate,
  type SecretSantaParticipant,
} from '../../../../core/models';
import { secretSantaDrawDeadline } from '../../../../core/utils';
import {
  OrgBadgeComponent,
  OrgBannerComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgCopyButtonComponent,
  OrgSurfaceComponent,
  OrgToggleComponent,
} from '../../../../shared/ui';

/** One participant's secret link, ready to send. */
export interface SecretSantaShareLink {
  readonly participantId: string;
  readonly name: string;
  readonly phone: string;
  readonly url: string;
  /** When the person opened the link (it opens once); null while not opened yet. */
  readonly openedAt: string | null;
  /** The person has an account and was also told in the app. */
  readonly notifiedInApp?: boolean;
}

/** "Abriu em 16/11, às 20:49" or "Ainda não abriu". */
export function linkStatus(openedAt: string | null): string {
  const date = new Date(openedAt ?? '');
  if (!openedAt || isNaN(date.getTime())) return 'Ainda não abriu';
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Abriu em ${day}, às ${time}`;
}

/**
 * "Amigo oculto" on the event page, for the organizers. The owner draws (and draws again),
 * then sends each participant their secret link by WhatsApp or copies it. Nobody sees who
 * drew whom here: each pair only exists behind its link.
 */
@Component({
  selector: 'app-secret-santa-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgBadgeComponent,
    OrgBannerComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgCopyButtonComponent,
    OrgSurfaceComponent,
    OrgToggleComponent,
  ],
  templateUrl: './secret-santa-card.component.html',
  styleUrl: './secret-santa-card.component.scss',
})
export class SecretSantaCardComponent {
  public readonly participants = input<readonly SecretSantaParticipant[]>([]);
  /** Only the owner draws and sends the links. */
  public readonly isOwner = input(false);
  /** When the latest draw happened (ISO); null before the first one. */
  public readonly drawnAt = input<string | null>(null);
  public readonly links = input<readonly SecretSantaShareLink[]>([]);
  /** Someone was added or removed after the draw. */
  public readonly outdated = input(false);
  public readonly drawing = input(false);
  /** The draw day chosen for the event (`YYYY-MM-DD`): drawing waits for it. */
  public readonly drawDate = input<string | null>(null);
  public readonly draw = output<void>();
  public readonly send = output<SecretSantaShareLink>();
  /** A new link for one person (the old one stops working), e.g. after they opened it. */
  public readonly resend = output<SecretSantaShareLink>();
  /** Participant whose new link is being created. */
  public readonly resendingId = input<string | null>(null);
  public readonly editParticipants = output<void>();
  /** "Participantes" opens the editor, which is closed once the event has happened. */
  public readonly canEditParticipants = input(true);
  /** Guests may still put themselves in the draw from the invite. */
  public readonly selfJoinOpen = input(true);
  public readonly selfJoinChange = output<boolean>();
  /** Possibly the same person twice (same name): the organizer decides. */
  public readonly duplicates = input<readonly SecretSantaDuplicate[]>([]);
  /** "Juntar": the two entries become one. */
  public readonly merge = output<SecretSantaDuplicate>();
  /** "São pessoas diferentes": the pair is no longer pointed out. */
  public readonly distinct = output<SecretSantaDuplicate>();
  /** The entry being merged or marked, while it saves. */
  public readonly busyDuplicateId = input<string | null>(null);

  protected readonly linkStatus = linkStatus;
  protected readonly openedCount = computed(() => this.links().filter((l) => l.openedAt).length);
  protected readonly canDraw = computed(
    () => this.participants().length >= SECRET_SANTA_MIN_PARTICIPANTS,
  );
  /** "20 de dezembro" while the draw day has not come; '' once drawing is allowed. */
  protected readonly drawOpensLabel = computed(() => {
    const opens = secretSantaDrawDeadline(this.drawDate());
    if (!opens || Date.now() >= opens.getTime()) return '';
    return opens.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Sao_Paulo',
    });
  });

  /** "Possível repetido", with each one's phone, so the organizer sees what differs. */
  protected duplicateMessage(pair: SecretSantaDuplicate): string {
    const who = (p: SecretSantaParticipant, how: string) =>
      `${p.name} (${how}${p.phone ? ', ' + p.phone : ''})`;
    return (
      `Possível repetido: ${who(pair.drop, 'adicionado à mão')} e ` +
      `${who(pair.keep, 'entrou pelo convite')}. Se for a mesma pessoa, junte as duas.`
    );
  }

  /** Everyone in the draw: who joined from the invitation plus who was added by hand. */
  protected readonly subheading = computed(() => {
    const count = this.participants().length;
    return count === 1 ? '1 pessoa no sorteio' : `${count} pessoas no sorteio`;
  });
  protected readonly joinedCount = computed(
    () => this.participants().filter((p) => p.joinedBy).length,
  );
  protected readonly drawnLabel = computed(() => {
    const iso = this.drawnAt();
    const date = new Date(iso ?? '');
    if (!iso || isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Sorteio feito em ${day}, às ${time}.`;
  });
}
