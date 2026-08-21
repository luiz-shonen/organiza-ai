import type { FamilyMember } from './family.model';
import type { GuestCompanion, GuestSession } from './guest.model';

export interface RsvpDrawerRequestData {
  session: GuestSession | null;
  familyMembers: FamilyMember[];
  userId: string;
}

export interface RsvpDrawerResult {
  name: string;
  phone: string;
  companions: GuestCompanion[];
  selectedFamilyMembers: FamilyMember[];
}

export interface CollaboratorDrawerRequestData {
  collaborators: string[];
  pendingInvites: string[];
}

export type CollaboratorDrawerResult =
  | { action: 'invite'; email: string }
  | { action: 'remove'; collaboratorId: string };

interface DrawerRequestBase {
  trigger?: HTMLElement | null;
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
