import { ChangeDetectionStrategy, Component, EventEmitter, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-rsvp-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  templateUrl: './rsvp-form.component.html',
  styleUrl: './rsvp-form.component.scss',
})
export class RsvpFormComponent {
  public isSubmitting = input<boolean>(false);
  public selectedMode = signal<'solo' | 'family'>('solo');

  @Output() onConfirm = new EventEmitter<{ name: string; phone: string; mode: string }>();

  protected setMode(mode: 'solo' | 'family'): void {
    this.selectedMode.set(mode);
  }

  protected onSubmit(form: NgForm): void {
    if (form.valid) {
      this.onConfirm.emit({
        name: form.value.name,
        phone: form.value.phone,
        mode: this.selectedMode(),
      });
      form.resetForm();
      this.selectedMode.set('solo');
    }
  }
}
