import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'org-textarea-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-textarea-field.component.html',
  styleUrl: './org-textarea-field.component.scss',
})
export class OrgTextareaFieldComponent {
  public readonly label = input.required<string>();
  public readonly value = model('');
  public readonly rows = input(3);
  public readonly placeholder = input('');
  public readonly hint = input('');
  public readonly error = input('');
  public readonly disabled = input(false);
  public readonly required = input(false);

  protected updateValue(event: Event): void {
    if (!this.disabled()) {
      this.value.set((event.target as HTMLTextAreaElement).value);
    }
  }
}
