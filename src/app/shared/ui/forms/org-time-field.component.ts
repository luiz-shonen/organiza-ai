import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'org-time-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './org-time-field.component.html',
  styleUrl: './org-time-field.component.scss',
})
export class OrgTimeFieldComponent {
  public readonly label = input('Horário');
  public readonly value = model('');

  public updateValue(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
