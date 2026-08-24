import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-design-system-code-example',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-code-example.component.html',
  styleUrl: './design-system-code-example.component.scss',
})
export class DesignSystemCodeExampleComponent {
  public readonly code = input.required<string>();
  public readonly label = input('Exemplo Angular');
  public readonly copied = signal(false);

  public async copy(): Promise<void> {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1800);
  }
}
