import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OrgCopyButtonComponent } from '../../shared/ui';

/** A ready-to-copy usage snippet under each demo of the catalog. */
@Component({
  selector: 'app-design-system-code-example',
  imports: [OrgCopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-code-example.component.html',
  styleUrl: './design-system-code-example.component.scss',
})
export class DesignSystemCodeExampleComponent {
  public readonly code = input.required<string>();
  public readonly label = input('Uso recomendado');
}
