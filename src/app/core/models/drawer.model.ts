import type { Signal } from '@angular/core';
import type { FamilyMember, FamilyMemberCreate } from './family.model';
import type { GuestCompanion, GuestSession } from './guest.model';
import type { RsvpSecretSantaChoice, RsvpSecretSantaData } from './secret-santa.model';

export interface RsvpDrawerRequestData {
  session: GuestSession | null;
  familyMembers: FamilyMember[];
  userId: string;
  /** Editing a presence already confirmed: the drawer opens filled in and saves instead of confirming. */
  existing?: { companions: readonly string[]; familyMemberIds: readonly string[] };
  /** Companions the guest brought before, kept on their profile ("Levar acompanhantes?"). */
  savedCompanions?: readonly string[];
  /** Saves a member added in the drawer to the profile's family, so it is kept even before "Confirmar". */
  addFamilyMember?: (member: FamilyMemberCreate) => Promise<FamilyMember>;
  /** The event has an amigo oculto: the drawer asks who takes part. */
  secretSanta?: RsvpSecretSantaData;
}

export interface RsvpDrawerResult {
  name: string;
  phone: string;
  companions: GuestCompanion[];
  selectedFamilyMembers: FamilyMember[];
  /** Who takes part in the amigo oculto; missing when the event has none or sign-ups are closed. */
  secretSanta?: RsvpSecretSantaChoice;
  /** A WhatsApp for a relative or companion in the draw; without one, the guest's is used. */
  secretSantaPhones?: Readonly<Record<string, string>>;
}

export interface CollaboratorDrawerRequestData {
  /** Each collaborator, live: their account id (to remove them) and their e-mail to show. */
  collaborators: Signal<readonly { id: string; label: string }[]>;
  /** E-mails invited who have not signed in yet, live. */
  pendingInvites: Signal<readonly string[]>;
}

export type CollaboratorDrawerResult =
  | { action: 'invite'; email: string }
  | { action: 'cancelInvite'; email: string }
  | { action: 'remove'; collaboratorId: string };

interface DrawerRequestBase {
  trigger?: HTMLElement | null;
  /** Called once the drawer closes (or another replaces it): stop what it was following. */
  onClose?: () => void;
}

export interface NavigationDrawerRequest extends DrawerRequestBase {
  kind: 'navigation';
}

export interface RsvpDrawerRequest extends DrawerRequestBase {
  kind: 'rsvp';
  data: RsvpDrawerRequestData;
  onComplete: (result: RsvpDrawerResult) => void;
}

export interface CollaboratorDrawerRequest extends DrawerRequestBase {
  kind: 'collaborator';
  data: CollaboratorDrawerRequestData;
  onAction: (result: CollaboratorDrawerResult) => void;
}

export type AppDrawerRequest =
  | NavigationDrawerRequest
  | RsvpDrawerRequest
  | CollaboratorDrawerRequest;

export type AppDrawerType = AppDrawerRequest['kind'];
