import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { EventService } from '../../core/services/event.service';
import { PartyEvent } from '../../core/models/event.model';
import {
  FeedbackService,
  OrgBadgeComponent,
  OrgButtonComponent,
  OrgEmptyStateComponent,
  OrgIconComponent,
  OrgIconButtonComponent,
  OrgMetricCardComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSectionComponent,
  OrgSurfaceComponent,
  OrgDialogService,
} from '../../shared/ui';
import { AdminFormDrawerComponent } from './components/admin-form-drawer/admin-form-drawer.component';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    OrgBadgeComponent,
    OrgButtonComponent,
    OrgEmptyStateComponent,
    OrgIconComponent,
    OrgIconButtonComponent,
    OrgMetricCardComponent,
    OrgPageHeaderComponent,
    OrgPageLayoutComponent,
    OrgSectionComponent,
    OrgSurfaceComponent,
    AdminFormDrawerComponent,
  ],
  templateUrl: './admin-dashboard.container.html',
  styleUrl: './admin-dashboard.container.scss',
})
export class AdminDashboardContainer implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly feedback = inject(FeedbackService);
  private readonly dialogs = inject(OrgDialogService);

  readonly admins = signal<string[]>([]);
  readonly loadingAdmins = signal(true);
  readonly isDrawerOpen = signal(false);
  readonly savingAdmin = signal(false);

  private readonly events$ = this.eventService.listEvents();
  readonly events = toSignal(this.events$, { initialValue: [] as PartyEvent[] });

  readonly superAdminEmails = ['luiz.gmr.dev@gmail.com', 'jessica.calm.dev@gmail.com'] as const;

  readonly metrics = computed(() => {
    const evts: PartyEvent[] = this.events() ?? [];
    const active = evts.filter((e: PartyEvent) => e.status !== 'cancelled').length;
    const adminCount = this.admins().length;
    return {
      totalEvents: evts.length,
      activeEvents: active,
      totalAdmins: adminCount,
      superAdmins: this.superAdminEmails.length,
    };
  });

  ngOnInit(): void {
    void this.loadAdmins();
  }

  async loadAdmins(): Promise<void> {
    this.loadingAdmins.set(true);
    try {
      const list = await this.authService.listAdmins();
      this.admins.set(list);
    } catch (err) {
      console.error(err);
      this.feedback.error('Erro ao carregar administradores');
    } finally {
      this.loadingAdmins.set(false);
    }
  }

  isSuperAdminUser(email: string): boolean {
    return this.authService.isSuperAdminEmail(email);
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  async handleAddAdmin(email: string): Promise<void> {
    this.savingAdmin.set(true);
    try {
      await this.authService.registerAdmin(email);
      this.feedback.success('Administrador cadastrado com sucesso!');
      this.closeDrawer();
      await this.loadAdmins();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao cadastrar administrador';
      this.feedback.error(errorMsg);
    } finally {
      this.savingAdmin.set(false);
    }
  }

  async handleRemoveAdmin(email: string): Promise<void> {
    if (this.isSuperAdminUser(email)) {
      this.feedback.info('Super administradores não podem ser removidos.');
      return;
    }

    this.dialogs
      .confirm({
        title: 'Remover Administrador',
        message: `Tem certeza que deseja remover as permissões administrativas do usuário "${email}"?`,
        confirmLabel: 'Remover Administrador',
      })
      .subscribe(async (result: boolean | undefined) => {
        if (result) {
          try {
            await this.authService.removeAdmin(email);
            this.feedback.success('Administrador removido com sucesso!');
            await this.loadAdmins();
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Erro ao remover administrador';
            this.feedback.error(errorMsg);
          }
        }
      });
  }
}
