export interface EventInvitation {
  id: string;
  eventId: string;
  eventTitle: string;
  invitedEmail: string;
  invitedBy: string;
  /** Who invites, as shown in the bell: their name and photo. */
  invitedByName?: string;
  invitedByPhoto?: string | null;
  createdAt: string;
}
