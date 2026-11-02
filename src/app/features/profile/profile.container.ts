import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserService, FamilyService, ThemeService } from '../../core/services';
import type { UserProfile, FamilyMember, ThemeMode } from '../../core/models';
import {
  OrgLoadingStateComponent,
  FeedbackService,
  OrgPageHeaderComponent,
  OrgPageLayoutComponent,
} from '../../shared/ui';
import { ProfilePreferencesCardComponent } from './components/profile-preferences-card/profile-preferences-card.component';
import { ProfileInfoCardComponent } from './components/profile-info-card/profile-info-card.component';
import {
  FamilyRosterManagerComponent,
  type AddFamilyMemberPayload,
  type UpdateFamilyMemberPayload,
} from './components/family-roster-manager/family-roster-manager.component';

@Component({
  selector: 'app-profile-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrgLoadingStateComponent,
    OrgPageLayoutComponent,
    OrgPageHeaderComponent,
    ProfileInfoCardComponent,
    FamilyRosterManagerComponent,
    ProfilePreferencesCardComponent,
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
  private readonly themeService = inject(ThemeService);

  protected readonly themeMode = this.themeService.mode;
  protected readonly isSuperAdmin = this.authService.isSuperAdmin;

  readonly loading = signal<boolean>(true);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly familyMembers = signal<FamilyMember[]>([]);
  readonly updating = signal<boolean>(false);
  readonly savingFamilyMember = signal<boolean>(false);

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
      const [profile, family] = await Promise.all([
        this.userService.getProfile(user.uid),
        this.familyService.getFamilyMembers(user.uid),
      ]);

      if (profile) {
        this.userProfile.set({
          ...profile,
          displayName: profile.displayName || profile.name || user.displayName || null,
          email: profile.email || user.email || null,
          photoURL: profile.photoURL || user.photoURL || null,
        });
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
      this.savingFamilyMember.set(true);
      const newMember = await this.familyService.addFamilyMember(user.uid, data);
      this.familyMembers.update((list) => [...list, newMember]);
      this.feedback.success('Familiar adicionado com sucesso!');
    } catch {
      this.feedback.error('Não foi possível adicionar o familiar. Tente novamente.');
    } finally {
      this.savingFamilyMember.set(false);
    }
  }

  async onUpdateFamilyMember({ id, ...changes }: UpdateFamilyMemberPayload): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      this.savingFamilyMember.set(true);
      await this.familyService.updateFamilyMember(user.uid, id, changes);
      this.familyMembers.update((list) =>
        list.map((member) => (member.id === id ? { ...member, ...changes } : member)),
      );
      this.feedback.success('Familiar atualizado com sucesso!');
    } catch {
      this.feedback.error('Não foi possível atualizar o familiar. Tente novamente.');
    } finally {
      this.savingFamilyMember.set(false);
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

  protected changeTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  protected openRoute(route: string): void {
    void this.router.navigateByUrl(route);
  }

  protected async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
