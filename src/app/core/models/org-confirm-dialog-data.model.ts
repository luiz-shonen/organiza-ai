/** `danger` for actions that delete, remove or cancel something; `default` otherwise. */
export type OrgConfirmDialogTone = 'default' | 'danger';

/** Icons the confirm dialog can show in its badge (a subset of the Org icon map). */
export type OrgConfirmDialogIcon =
  | 'delete_outline'
  | 'block'
  | 'cancel'
  | 'logout'
  | 'info'
  | 'error';

export interface OrgConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  /** Label of the button that keeps things as they are, e.g. "Manter evento". */
  readonly cancelLabel?: string;
  readonly tone?: OrgConfirmDialogTone;
  /** Defaults to `delete_outline` for danger and `info` otherwise. */
  readonly icon?: OrgConfirmDialogIcon;
  /**
   * A second way forward beside the main one ("Adicionar mesmo assim" next to "Substituir"):
   * shown between "cancel" and the main button; `choose()` tells which was pressed.
   */
  readonly extraLabel?: string;
}

/** What `choose()` returns: the main button, the extra one, or neither (closed, cancelled). */
export type OrgDialogChoice = 'confirm' | 'extra' | 'cancel';

export type ConfirmDialogData = OrgConfirmDialogData;
