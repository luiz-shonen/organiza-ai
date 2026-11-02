import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { OrgIconComponent } from '../actions/org-icon.component';

/** − value + counter with 48px buttons. */
@Component({
  selector: 'org-quantity-stepper',
  standalone: true,
  imports: [OrgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-quantity-stepper.component.html',
  styleUrl: './org-quantity-stepper.component.scss',
})
export class OrgQuantityStepperComponent {
  public readonly value = model(1);
  public readonly min = input(1);
  public readonly max = input(99);
  public readonly unit = input<string | null>(null);
  public readonly ariaLabel = input('Quantidade');

  protected readonly canDecrease = computed(() => this.value() > this.min());
  protected readonly canIncrease = computed(() => this.value() < this.max());

  protected step(delta: number): void {
    this.value.set(Math.min(this.max(), Math.max(this.min(), this.value() + delta)));
  }
}
