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
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, UserService } from '../../core/services';
import type { UserProfile, PartyEvent } from '../../core/models';
import { ProfileInfoCardComponent } from './components/profile-info-card/profile-info-card.component';

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
    ProfileInfoCardComponent,
  ],
  templateUrl: './profile.container.html',
  styleUrl: './profile.container.scss',
})
export class ProfileContainer implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(true);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly attendedEvents = signal<PartyEvent[]>([]);
  readonly updating = signal<boolean>(false);

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
      const [profile, events] = await Promise.all([
        this.userService.getProfile(user.uid),
        this.userService.getAttendedEvents(user.uid),
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
      this.snackBar.open('Nome atualizado com sucesso!', 'Fechar', { duration: 3000 });
    } catch {
      this.snackBar.open('Não foi possível atualizar o nome. Tente novamente.', 'Fechar', {
        duration: 3000,
      });
    } finally {
      this.updating.set(false);
    }
  }
}
