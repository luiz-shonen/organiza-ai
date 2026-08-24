import { ChangeDetectionStrategy, Component, model, input } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'org-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
  templateUrl: './org-date-field.component.html',
  styleUrl: './org-date-field.component.scss',
})
export class OrgDateFieldComponent {
  public readonly label = input('Data');
  public readonly value = model<Date | null>(null);
}
