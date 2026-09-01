import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgStepComponent } from './org-step.component';
import { OrgStepperComponent } from './org-stepper.component';

@Component({
  selector: 'org-stepper-host',
  standalone: true,
  imports: [OrgStepComponent, OrgStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<org-stepper #stepper
    ><org-step label="Informações">Dados básicos</org-step
    ><org-step label="Convidados">Lista de convidados</org-step></org-stepper
  >`,
})
class OrgStepperHostComponent {
  @ViewChild('stepper', { static: true }) public readonly stepper!: OrgStepperComponent;
}

describe('OrgStepperComponent', () => {
  it('projects closed steps and exposes selected index', async () => {
    await TestBed.configureTestingModule({
      imports: [OrgStepperHostComponent],
    }).compileComponents();
    const fixture: ComponentFixture<OrgStepperHostComponent> =
      TestBed.createComponent(OrgStepperHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Informações');
    expect(fixture.nativeElement.textContent).toContain('Convidados');
    fixture.componentInstance.stepper.selectedIndex.set(1);
    expect(fixture.componentInstance.stepper.selectedIndex()).toBe(1);
  });
});
