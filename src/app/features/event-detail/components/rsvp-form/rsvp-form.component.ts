import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-rsvp-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './rsvp-form.component.html',
  styleUrl: './rsvp-form.component.scss',
})
export class RsvpFormComponent {
  public isSubmitting = input<boolean>(false);
  @Output() onConfirm = new EventEmitter<{ name: string; phone: string }>();

  protected onSubmit(form: NgForm): void {
    if (form.valid) {
      this.onConfirm.emit({
        name: form.value.name,
        phone: form.value.phone,
      });
      form.resetForm();
    }
  }
}
