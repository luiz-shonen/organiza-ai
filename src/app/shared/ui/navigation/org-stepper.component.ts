import { MatIconModule } from '@angular/material/icon';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { MatStepper, MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { OrgStepComponent } from './org-step.component';

/** A field a person types into or picks from; buttons and links are left alone. */
const FIRST_FIELD =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), select:not(:disabled)';

@Component({
  selector: 'org-stepper',
  standalone: true,
  imports: [MatIconModule, MatStepperModule, NgTemplateOutlet],
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Set when the step changes, so the new step's first field gets the focus once it slides in. */
  private focusPending = false;
  /** The current step's name, whole ("Amigo oculto"), for the phone header. */
  protected readonly currentLabel = computed(
    () => this.steps()[this.selectedIndex()]?.label() ?? '',
  );

  /** A bar of the phone header: in a linear stepper, a step not reached yet stays shut. */
  protected select(index: number): void {
    this.materialStepper().selectedIndex = index;
  }

  public next(): void {
    this.materialStepper().next();
  }

  public previous(): void {
    this.materialStepper().previous();
  }

  protected updateSelection(index: number): void {
    this.selectedIndex.set(index);
    this.selectionChange.emit(index);
    // "Próximo" sits at the bottom of a long step: back to the top of the steps.
    this.host.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    this.focusPending = true;
  }

  /** Once the new step is in place, its first field takes the focus, ready to type. */
  protected focusFirstField(): void {
    if (!this.focusPending) return;
    this.focusPending = false;
    const field = this.host.nativeElement
      .querySelector<HTMLElement>(
        '.mat-horizontal-stepper-content-current, .mat-vertical-content-container-active',
      )
      ?.querySelector<HTMLElement>(FIRST_FIELD);
    field?.focus({ preventScroll: true });
  }
}
