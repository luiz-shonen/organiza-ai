import { ChangeDetectionStrategy, Component, TemplateRef, input, viewChild } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';

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
  /** Optional for catalog previews; production linear flows supply their own control. */
  public readonly stepControl = input<AbstractControl | null>(null);
  public readonly content = viewChild.required<TemplateRef<unknown>>('content');
  private readonly previewControl = new FormControl('');

  public materialStepControl(): AbstractControl {
    return this.stepControl() ?? this.previewControl;
  }
}
