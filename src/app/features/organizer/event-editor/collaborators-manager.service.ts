import { Injectable, inject, signal } from '@angular/core';
import { combineLatest, firstValueFrom, map, type Subscription } from 'rxjs';
import type { PartyEvent } from '../../../core/models';
import {
  AuthService,
  DrawerService,
  EventService,
  PeopleNoticesService,
  UserService,
} from '../../../core/services';
import { explainError } from '../../../core/utils/error.utils';
import { FeedbackService, OrgDialogService } from '../../../shared/ui';

interface CollaboratorRow {
  id: string;
  label: string;
}

/**
 * "Colaboradores": the drawer where the owner invites someone by e-mail to help organise the
 * event. The e-mail shows at once under "Convites pendentes" (and can be withdrawn); when that
 * person signs in, the invite becomes a collaborator, listed by e-mail under "Colaboradores
 * ativos". The drawer follows all of it live while open. Opened from the editor and the event page.
 */
@Injectable({ providedIn: 'root' })
export class CollaboratorsManagerService {
  private readonly drawerService = inject(DrawerService);
  private readonly eventService = inject(EventService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly peopleNotices = inject(PeopleNoticesService);
  private readonly feedback = inject(FeedbackService);
  private readonly dialogs = inject(OrgDialogService);

  open(event: Pick<PartyEvent, 'id' | 'title'>): void {
    if (!event.id) return;
    const eventId = event.id;
    const collaborators = signal<readonly CollaboratorRow[]>([]);
    const pendingInvites = signal<readonly string[]>([]);
    const names = new Map<string, string>();

    const live: Subscription[] = [
      // Who collaborates (the event), each with the e-mail they saved on accepting the invite.
      combineLatest([
        this.eventService.getEvent(eventId).pipe(map((ev) => ev?.collaborators ?? [])),
        this.eventService.collaboratorEmails$(eventId),
      ]).subscribe({
        next: ([ids, emails]) => {
          collaborators.set(ids.map((id) => ({ id, label: emails[id] || names.get(id) || '…' })));
          // Someone who accepted before e-mails were kept shows their name until they sign in.
          for (const id of ids.filter((id) => !emails[id] && !names.has(id))) {
            names.set(id, '');
            void this.userService
              .publicName(id)
              .catch(() => '')
              .then((name) => {
                names.set(id, name || 'Colaborador(a)');
                collaborators.update((list) =>
                  list.map((c) =>
                    c.id === id && c.label === '…' ? { ...c, label: names.get(id)! } : c,
                  ),
                );
              });
          }
        },
        error: () => undefined,
      }),
      this.eventService.listPendingInvitations(eventId).subscribe({
        next: (invites) => pendingInvites.set(invites.map((invite) => invite.invitedEmail)),
        error: () => undefined,
      }),
    ];

    this.drawerService.open({
      kind: 'collaborator',
      data: { collaborators, pendingInvites },
      onClose: () => live.forEach((sub) => sub.unsubscribe()),
      onAction: async (action) => {
        if (action.action === 'invite') {
          if (pendingInvites().includes(action.email)) {
            this.feedback.success(`${action.email} já está em Convites pendentes`);
            return;
          }
          try {
            const me = this.authService.currentUser();
            const myName = me ? await this.userService.publicName(me.uid).catch(() => '') : '';
            await this.eventService.inviteCollaborator(
              eventId,
              action.email,
              event.title,
              me?.email || '',
              { name: myName || me?.displayName, photo: me?.photoURL },
            );
            this.peopleNotices.collaboratorInvited(eventId, action.email);
            this.feedback.success(`Convite enviado para ${action.email}`);
          } catch (error) {
            this.feedback.error(explainError('Não foi possível enviar o convite', error));
          }
          return;
        }
        if (action.action === 'cancelInvite') {
          try {
            await this.eventService.cancelInvitation(eventId, action.email);
            this.feedback.success(`Convite para ${action.email} removido`);
          } catch (error) {
            this.feedback.error(explainError('Não foi possível remover o convite', error));
          }
          return;
        }
        const label =
          collaborators().find((c) => c.id === action.collaboratorId)?.label ?? 'Essa pessoa';
        const confirmed = await firstValueFrom(
          this.dialogs.confirm({
            title: 'Remover colaborador',
            message: `${label} deixa de poder editar os itens e ver a lista de convidados deste evento.`,
            confirmLabel: 'Remover',
            tone: 'danger',
            icon: 'block',
          }),
        );
        if (!confirmed) return;
        try {
          await this.eventService.removeCollaborator(eventId, action.collaboratorId);
          this.feedback.success('Colaborador removido');
        } catch (error) {
          this.feedback.error(explainError('Não foi possível remover o colaborador', error));
        }
      },
    });
  }
}
