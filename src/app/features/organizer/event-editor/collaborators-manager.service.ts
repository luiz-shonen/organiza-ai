import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PartyEvent } from '../../../core/models';
import { AuthService, DrawerService, EventService, UserService } from '../../../core/services';
import { explainError } from '../../../core/utils/error.utils';
import { FeedbackService, OrgDialogService } from '../../../shared/ui';

/**
 * "Colaboradores": the drawer where the owner invites someone by e-mail to help organise the
 * event, or removes a collaborator. Opened from the editor and from the event page alike.
 */
@Injectable({ providedIn: 'root' })
export class CollaboratorsManagerService {
  private readonly drawerService = inject(DrawerService);
  private readonly eventService = inject(EventService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly dialogs = inject(OrgDialogService);

  async open(event: Pick<PartyEvent, 'id' | 'title' | 'collaborators'>): Promise<void> {
    if (!event.id) return;
    const ids = event.collaborators ?? [];
    // Whatever cannot be read leaves the drawer to open with less, never not at all.
    const safe = <T>(load: () => Promise<T>, fallback: T): Promise<T> =>
      Promise.resolve()
        .then(load)
        .catch(() => fallback);
    const [emails, pendingInvites, names] = await Promise.all([
      safe(() => this.eventService.collaboratorEmails(event.id), {} as Record<string, string>),
      safe(() => this.eventService.pendingInvitationEmails(event.id), [] as string[]),
      Promise.all(ids.map((id) => safe(() => this.userService.publicName(id), ''))),
    ]);
    // By e-mail; someone who has not signed in since keeps their name until they do.
    const collaborators = ids.map((id, i) => ({
      id,
      label: emails[id] || names[i] || 'Colaborador(a)',
    }));
    this.drawerService.open({
      kind: 'collaborator',
      data: { collaborators, pendingInvites },
      onAction: async (action) => {
        if (action.action === 'invite') {
          try {
            await this.eventService.inviteCollaborator(
              event.id,
              action.email,
              event.title,
              this.authService.currentUser()?.email || '',
            );
            this.feedback.success(`Convite enviado para ${action.email}`);
          } catch (error) {
            this.feedback.error(explainError('Não foi possível enviar o convite', error));
          }
          return;
        }
        const confirmed = await firstValueFrom(
          this.dialogs.confirm({
            title: 'Remover colaborador',
            message: `${
              collaborators.find((c) => c.id === action.collaboratorId)?.label ?? 'Essa pessoa'
            } deixa de poder editar os itens e ver a lista de convidados deste evento.`,
            confirmLabel: 'Remover',
            tone: 'danger',
            icon: 'block',
          }),
        );
        if (!confirmed) return;
        try {
          await this.eventService.removeCollaborator(event.id, action.collaboratorId);
          this.feedback.success('Colaborador removido');
        } catch (error) {
          this.feedback.error(explainError('Não foi possível remover o colaborador', error));
        }
      },
    });
  }
}
