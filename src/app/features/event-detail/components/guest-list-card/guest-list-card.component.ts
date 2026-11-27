import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { GuestDecline, ManualGuestInput } from '../../../../core/models';
import type { KnownPerson } from '../../../../core/utils/known-people.utils';
import {
  householdPeople,
  petsLabel,
  type GuestHousehold,
  type PendingGuest,
} from '../../../../core/utils';
import { Phone } from '../../../../core/value-objects';
import {
  OrgAvatarComponent,
  OrgBottomSheetComponent,
  OrgButtonComponent,
  OrgCardHeaderComponent,
  OrgExpansionPanelComponent,
  OrgIconButtonComponent,
  OrgIconComponent,
  OrgSurfaceComponent,
  OrgTooltipComponent,
} from '../../../../shared/ui';
import {
  ManualGuestFormComponent,
  type ManualGuestSantaSettings,
} from '../manual-guest-form/manual-guest-form.component';

/**
 * "Quem vai" on the event page: one panel per confirmed household, like "Levar familiares?",
 * with each person (the guest, their family, their companions) and what they bring. Organizers
 * also see phones, the declines, and the PDF / print actions in the header, and put people on the
 * list by hand ("Adicionar alguém à mão"), who they edit and remove from the family's panel.
 */
@Component({
  selector: 'app-guest-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgAvatarComponent,
    OrgBottomSheetComponent,
    OrgButtonComponent,
    OrgCardHeaderComponent,
    OrgExpansionPanelComponent,
    OrgIconButtonComponent,
    OrgIconComponent,
    OrgSurfaceComponent,
    OrgTooltipComponent,
    ManualGuestFormComponent,
  ],
  templateUrl: './guest-list-card.component.html',
  styleUrl: './guest-list-card.component.scss',
})
export class GuestListCardComponent {
  readonly households = input.required<readonly GuestHousehold[]>();
  /** Organizers only: phones, "Não poderão ir", PDF and print. */
  readonly forOrganizer = input(false);
  readonly declines = input<readonly GuestDecline[]>([]);
  /** The event has a list of things to bring: without one, "Não leva nada da lista" is not said. */
  readonly hasItems = input(true);
  /** "Jéssica Melo" → "Jéssica": whom the family and companions come with. */
  protected firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
  }
  /** Organizers only: confirmations waiting for approval ("Aprovar presenças"). */
  readonly pending = input<readonly PendingGuest[]>([]);
  /** The waiting guest being approved or refused, while it saves. */
  readonly busyGuestId = input<string | null>(null);
  readonly approve = output<PendingGuest>();
  readonly refuse = output<PendingGuest>();

  /** "Baixar": the list as a PDF. */
  readonly download = output<void>();
  readonly print = output<void>();

  /**
   * Organizers only: saves someone added by hand (`id` null) or changes them, and resolves true
   * when it worked; the drawer then closes.
   */
  /** People added by hand before (no account), offered in "Adicionar alguém à mão". */
  readonly knownPeople = input<readonly KnownPerson[]>([]);
  readonly saveManual = input<
    ((guest: ManualGuestInput, household: GuestHousehold | null) => Promise<boolean>) | null
  >(null);
  /** "Remover" on someone added by hand; the page asks before taking them off the list. */
  readonly removeManual = output<GuestHousehold>();
  /** The amigo oculto offered when adding someone by hand; null when there is none to join. */
  readonly manualSecretSanta = input<ManualGuestSantaSettings | null>(null);

  /** The drawer: 'new' to add someone, or the hand-added household being edited. */
  protected readonly manualSheet = signal<'new' | GuestHousehold | null>(null);
  protected readonly editingManual = computed(() => {
    const sheet = this.manualSheet();
    return sheet && sheet !== 'new' ? sheet : null;
  });
  /** What the edit form starts with: the name, WhatsApp and companions saved. */
  protected readonly manualDraft = computed<ManualGuestInput | null>(() => {
    const household = this.editingManual();
    if (!household) return null;
    return {
      name: household.name,
      phone: household.phone,
      companions: household.members
        .filter((person) => person.role === 'Acompanhante')
        .map((person) => person.name),
      relatives: household.members.flatMap(({ role, guestId, name, relationship, phone }) =>
        role === 'Família' && guestId && relationship
          ? [{ id: guestId, name, relationship, phone: phone ?? '' }]
          : [],
      ),
    };
  });
  protected readonly saveManualAndClose = async (guest: ManualGuestInput): Promise<boolean> => {
    const save = this.saveManual();
    if (!save) return false;
    const saved = await save(guest, this.editingManual());
    if (saved) this.manualSheet.set(null);
    return saved;
  };

  protected readonly displayPhone = Phone.display;

  /** "5 confirmados": everyone going, the guests and the people coming with them. */
  /** Everyone going: the guests and the people coming with them. */
  protected readonly people = computed(() =>
    this.households().reduce((total, household) => total + householdPeople(household), 0),
  );
  /** Pets go too, but are counted apart from people. */
  protected readonly pets = computed(() =>
    this.households().reduce((total, household) => total + (household.pets ?? 0), 0),
  );
  /** Under the heading: how many answered (and the pets), the count of people in the pill. */
  protected readonly summary = computed(() => {
    // The host is listed, but did not answer.
    const families = this.households().filter((household) => !household.host).length;
    const answered =
      families === 0
        ? 'Ninguém respondeu ainda'
        : families === 1
          ? '1 família respondeu'
          : `${families} famílias responderam`;
    return this.pets() ? `${answered} · ${petsLabel(this.pets())}` : answered;
  });

  /** Beside the guest's name: "+2 · 3 itens", short enough for a phone. */
  /** Something to open: who comes with them, or what they bring (or not) from the list. */
  protected hasDetails(household: GuestHousehold): boolean {
    return (
      household.members.length > 1 ||
      household.bring.length > 0 ||
      this.hasItems() ||
      this.canManage(household)
    );
  }

  /** The mark on the avatar of who organizes: a crown for the owner, a handshake for a helper. */
  protected roleOf(household: GuestHousehold): { label: string; host: boolean } | null {
    if (household.host) return { label: 'Organizador(a) do evento', host: true };
    if (household.collaborator) return { label: 'Ajuda a organizar o evento', host: false };
    return null;
  }

  /** Someone added by hand: the organizers edit and remove them from their panel. */
  protected canManage(household: GuestHousehold): boolean {
    return this.forOrganizer() && !!household.manual && !!this.saveManual();
  }

  /** "Expandir tudo" / "Recolher tudo": every family at once. Folded when the page opens. */
  protected readonly allOpen = signal(false);
  protected readonly hasAnyDetails = computed(() =>
    this.households().some((household) => this.hasDetails(household)),
  );

  protected householdSummary(household: GuestHousehold): string {
    // Only what the line does not already say: one person alone needs no "1 pessoa".
    const people = householdPeople(household);
    const items = household.bring.length;
    return [
      ...(people > 1 ? [`${people} pessoas`] : []),
      ...(household.pets ? [petsLabel(household.pets)] : []),
      ...(items ? [items === 1 ? '1 item' : `${items} itens`] : []),
    ].join(' · ');
  }
}
