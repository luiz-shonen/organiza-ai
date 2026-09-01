export interface BatchPrimaryGuestInput {
  readonly uid: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly photoUrl?: string;
  readonly companionsCount?: number;
}
