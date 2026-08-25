import { ChangeDetectionStrategy, Component, contentChildren, input, model, output } from '@angular/core';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { OrgStepComponent } from './org-step.component';

@Component({
  selector: 'org-stepper',
  standalone: true,
  imports: [MatStepperModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-stepper.component.html',
  styleUrl: './org-stepper.component.scss',
})
export class OrgStepperComponent {
  public readonly selectedIndex = model(0);
  public readonly orientation = input<StepperOrientation>('horizontal');
  public readonly selectionChange = output<number>();
  protected readonly steps = contentChildren(OrgStepComponent);

  protected updateSelection(index: number): void {
    this.selectedIndex.set(index);
    this.selectionChange.emit(index);
  }
}
