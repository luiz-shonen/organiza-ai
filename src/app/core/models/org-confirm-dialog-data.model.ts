export interface OrgConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

export type ConfirmDialogData = OrgConfirmDialogData;
