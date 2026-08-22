import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService, UserService, FamilyService } from '../../core/services';
import type { UserProfile, PartyEvent, FamilyMember } from '../../core/models';
import {
  FeedbackService,
  OrgButtonDirective,
  OrgEmptyStateComponent,
  OrgIconComponent,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
  OrgSectionComponent,
  OrgSurfaceDirective,
} from '../../shared/ui';
import { ProfileInfoCardComponent } from './components/profile-info-card/profile-info-card.component';
import {
  FamilyRosterManagerComponent,
  type AddFamilyMemberPayload,
} from './components/family-roster-manager/family-roster-manager.component';

@Component({
  selector: 'app-profile-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    OrgSectionComponent,
    OrgSurfaceDirective,
    OrgEmptyStateComponent,
    OrgButtonDirective,
    OrgIconComponent,
    ProfileInfoCardComponent,
    FamilyRosterManagerComponent,
  ],
  templateUrl: './profile.container.html',
  styleUrl: './profile.container.scss',
})
export class ProfileContainer implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  readonly loading = signal<boolean>(true);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly attendedEvents = signal<PartyEvent[]>([]);
  readonly familyMembers = signal<FamilyMember[]>([]);
  readonly updating = signal<boolean>(false);
  readonly addingFamilyMember = signal<boolean>(false);

  private isLoaded = false;

  ngOnInit(): void {
    if (!this.isLoaded) {
      void this.loadProfileData();
    }
  }

  async loadProfileData(): Promise<void> {
    this.isLoaded = true;
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.loading.set(true);
      const [profile, events, family] = await Promise.all([
        this.userService.getProfile(user.uid),
        this.userService.getAttendedEvents(user.uid),
        this.familyService.getFamilyMembers(user.uid),
      ]);

      if (profile) {
        this.userProfile.set(profile);
      } else {
        this.userProfile.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          name: user.displayName ?? undefined,
          createdAt: '',
          updatedAt: '',
        });
      }

      this.attendedEvents.set(events ?? []);
      this.familyMembers.set(family ?? []);
    } catch (err) {
      console.error('Error loading profile container data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async onUpdateName(newName: string): Promise<void> {
    const current = this.userProfile();
    if (!current) return;

    try {
      this.updating.set(true);
      await this.userService.updateProfile(current.uid, { displayName: newName });
      this.userProfile.set({
        ...current,
        displayName: newName,
        name: newName,
      });
      this.feedback.success('Nome atualizado com sucesso!');
    } catch {
      this.feedback.error('Não foi possível atualizar o nome. Tente novamente.');
    } finally {
      this.updating.set(false);
    }
  }

  async onAddFamilyMember(data: AddFamilyMemberPayload): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      this.addingFamilyMember.set(true);
      const newMember = await this.familyService.addFamilyMember(user.uid, data);
      this.familyMembers.update((list) => [...list, newMember]);
      this.feedback.success('Familiar adicionado com sucesso!');
    } catch {
      this.feedback.error('Não foi possível adicionar o familiar. Tente novamente.');
    } finally {
      this.addingFamilyMember.set(false);
    }
  }

  async onRemoveFamilyMember(memberId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      await this.familyService.deleteFamilyMember(user.uid, memberId);
      this.familyMembers.update((list) => list.filter((m) => m.id !== memberId));
      this.feedback.success('Familiar removido com sucesso!');
    } catch {
      this.feedback.error('Não foi possível remover o familiar. Tente novamente.');
    }
  }
}
