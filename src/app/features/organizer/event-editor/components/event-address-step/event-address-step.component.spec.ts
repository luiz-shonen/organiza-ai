import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventAddressStepComponent } from './event-address-step.component';
import type { EventAddressForm } from '../../../../../core/models';

describe('EventAddressStepComponent', () => {
  let fixture: ComponentFixture<EventAddressStepComponent>;
  let form: EventAddressForm;
  const required = () =>
    new FormControl('', { nonNullable: true, validators: Validators.required });
  const el = () => fixture.nativeElement as HTMLElement;
  const pressNext = () => {
    (
      el().querySelector(
        '[data-testid="stepper-next-btn"] button, button[data-testid="stepper-next-btn"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
  };
  const message = () => el().querySelector('[data-testid="step-missing-fields"]')?.textContent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAddressStepComponent],
    }).compileComponents();
    form = new FormGroup({
      cep: required(),
      address: required(),
      neighborhood: required(),
      city: required(),
      number: required(),
    });
    fixture = TestBed.createComponent(EventAddressStepComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
  });

  it('keeps Próximo pressable and says what is missing instead of moving on', () => {
    const moved: void[] = [];
    fixture.componentInstance.next.subscribe(() => moved.push(undefined));
    expect(message()).toBeUndefined();

    pressNext();
    expect(moved).toHaveLength(0);
    expect(message()).toContain('Para continuar, preencha o CEP e o número.');

    form.patchValue({ cep: '01001-000', number: '10' });
    fixture.detectChanges();
    expect(message()).toContain('Não encontramos a rua desse CEP');
  });

  it('moves on when everything is filled', () => {
    const moved: void[] = [];
    fixture.componentInstance.next.subscribe(() => moved.push(undefined));
    form.setValue({
      cep: '01001-000',
      address: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo/SP',
      number: '10',
    });
    pressNext();
    expect(moved).toHaveLength(1);
    expect(message()).toBeUndefined();
  });
});
