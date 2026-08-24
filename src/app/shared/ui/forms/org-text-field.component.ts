import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type OrgTextFieldType = 'email' | 'password' | 'search' | 'tel' | 'text' | 'url';

const VALID_TYPES: ReadonlySet<OrgTextFieldType> = new Set(['email', 'password', 'search', 'tel', 'text', 'url']);

function normalizeType(value: unknown): OrgTextFieldType {
  return typeof value === 'string' && VALID_TYPES.has(value as OrgTextFieldType)
    ? (value as OrgTextFieldType)
    : 'text';
}

@Component({
  selector: 'org-text-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-text-field.component.html',
  styleUrl: './org-text-field.component.scss',
})
export class OrgTextFieldComponent {
  public readonly label = input.required<string>();
  public readonly value = model('');
  public readonly type = input<OrgTextFieldType, unknown>('text', { transform: normalizeType });
  public readonly placeholder = input('');
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);

  protected updateValue(event: Event): void {
    if (!this.disabled()) {
      this.value.set((event.target as HTMLInputElement).value);
    }
  }
}
