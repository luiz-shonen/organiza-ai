export interface BatchPrimaryGuestInput {
  readonly uid: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly photoUrl?: string;
  readonly companionsCount?: number;
  /** The event asks for approval and this is the guest's first answer. */
  readonly pendingApproval?: boolean;
}
