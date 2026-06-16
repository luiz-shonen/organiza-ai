import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuestSession } from '../../../../core/models';

export interface GuestFormDialogData {
  session: GuestSession | null;
}

export interface GuestFormDialogResult {
  name: string;
  phone: string;
  companionsCount: number;
}

@Component({
  selector: 'app-guest-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="guest-dialog__icon">person_add</mat-icon>
      Confirme seus dados
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="guest-dialog__form" id="guest-form">
        <mat-form-field appearance="outline">
          <mat-label>Seu nome</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex: Maria Silva"
            autocomplete="name"
            required
          />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>WhatsApp / Telefone</mat-label>
          <input
            matInput
            formControlName="phone"
            placeholder="(11) 99999-9999"
            autocomplete="tel"
            type="tel"
            required
          />
          @if (form.controls.phone.hasError('required')) {
            <mat-error>Telefone é obrigatório</mat-error>
          }
          @if (form.controls.phone.hasError('minlength')) {
            <mat-error>Mínimo 10 dígitos</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Acompanhantes</mat-label>
          <input
            matInput
            formControlName="companionsCount"
            type="number"
            min="0"
            placeholder="0"
          />
          <mat-hint>Quantas pessoas além de você</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close aria-label="Cancelar">Cancelar</button>
      <button
        mat-flat-button
        [disabled]="form.invalid"
        (click)="submit()"
        aria-label="Confirmar presença"
      >
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .guest-dialog {
      &__icon {
        vertical-align: middle;
        margin-right: 8px;
        color: var(--mat-sys-primary);
      }

      &__form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 280px;
        padding-top: 8px;
      }
    }
  `,
})
export class GuestFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<GuestFormDialogComponent>);
  private readonly data: GuestFormDialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.session?.name ?? '', [Validators.required]],
    phone: [this.data.session?.phone ?? '', [Validators.required, Validators.minLength(10)]],
    companionsCount: [0, [Validators.min(0)]],
  });

  protected submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
