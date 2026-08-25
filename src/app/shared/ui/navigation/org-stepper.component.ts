import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { MatStepper, MatStepperModule, StepperOrientation } from '@angular/material/stepper';
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
  public readonly linear = input(false);
  public readonly compact = input(false);
  public readonly ariaLabel = input('Etapas');
  public readonly selectionChange = output<number>();
  protected readonly steps = contentChildren(OrgStepComponent);
  private readonly materialStepper = viewChild.required(MatStepper);

  public next(): void {
    this.materialStepper().next();
  }

  public previous(): void {
    this.materialStepper().previous();
  }

  protected updateSelection(index: number): void {
    this.selectedIndex.set(index);
    this.selectionChange.emit(index);
  }
}
