import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PartyEvent } from '../../../core/models';
import { AuthService, DrawerService, EventService } from '../../../core/services';
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
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);
  private readonly dialogs = inject(OrgDialogService);

  open(event: Pick<PartyEvent, 'id' | 'title' | 'collaborators'>): void {
    if (!event.id) return;
    this.drawerService.open({
      kind: 'collaborator',
      data: {
        collaborators: event.collaborators ?? [],
        pendingInvites: [],
      },
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
            message: `${action.collaboratorId} deixa de poder editar os itens e ver a lista de convidados deste evento.`,
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
