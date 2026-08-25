import { ChangeDetectionStrategy, Component, TemplateRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'org-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-step.component.html',
  styleUrl: './org-step.component.scss',
})
export class OrgStepComponent {
  public readonly label = input.required<string>();
  public readonly disabled = input(false);
  public readonly content = viewChild.required<TemplateRef<unknown>>('content');
}
