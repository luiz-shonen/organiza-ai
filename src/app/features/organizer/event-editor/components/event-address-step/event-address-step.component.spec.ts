import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventAddressStepComponent } from './event-address-step.component';
import type { EventAddressForm } from '../../../../../core/models';
import { MapLocation, valueObjectValidator } from '../../../../../core/value-objects';

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
      neighborhood: new FormControl('', { nonNullable: true, validators: Validators.required }),
      city: required(),
      number: required(),
      noNumber: new FormControl(false, { nonNullable: true }),
      complement: new FormControl('', { nonNullable: true }),
      directions: new FormControl('', { nonNullable: true }),
      mapLocation: new FormControl('', {
        nonNullable: true,
        validators: valueObjectValidator(MapLocation.validate),
      }),
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
    expect(message()).toContain('Digite o CEP completo para buscarmos o endereço.');
  });

  const input = (testId: string) =>
    el().querySelector(`[data-testid="${testId}"]`) as HTMLInputElement | HTMLTextAreaElement;

  it('locks the fields until the CEP fills them', () => {
    expect(input('event-street-input').readOnly).toBe(true);
    expect(input('event-city-input').readOnly).toBe(true);
    expect(el().querySelector('[data-testid="event-address-partial"]')).toBeNull();
  });

  it('opens what a rural CEP did not bring, and says so', () => {
    form.patchValue({ cep: '35830-000', city: 'Jaboticatubas/MG', number: '1' });
    fixture.componentRef.setInput('found', { address: false, neighborhood: false, city: true });
    fixture.detectChanges();

    expect(input('event-street-input').readOnly).toBe(false);
    expect(input('event-neighborhood-input').readOnly).toBe(false);
    expect(input('event-city-input').readOnly).toBe(true);
    expect(el().querySelector('[data-testid="event-address-partial"]')?.textContent).toContain(
      'O CEP não trouxe o endereço completo',
    );
    expect(el().textContent).not.toContain('Bairro (opcional)');

    pressNext();
    expect(message()).toContain('Para continuar, preencha o endereço e o bairro.');
  });

  it('ticks "Sem número" into the form, and shows the complement and directions', () => {
    const box = el().querySelector('[data-testid="event-no-number"] input') as HTMLInputElement;
    box.click();
    fixture.detectChanges();
    expect(form.controls.noNumber.value).toBe(true);
    expect(input('event-complement-input')).toBeTruthy();
    expect(input('event-directions-input')).toBeTruthy();
  });

  it('says what it understood from the map link, and shortens a long one to its pin', () => {
    const field = () =>
      el().querySelector('[data-testid="event-map-location-input"]') as HTMLInputElement;
    expect(el().textContent).toContain('Cole o link de "Compartilhar" do Google Maps');

    form.controls.mapLocation.setValue(
      'https://www.google.com/maps/place/S%C3%ADtio+Boa+Vista/@-19.3,-43.7,15z/data=!3d-19.31!4d-43.71',
    );
    field().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(form.controls.mapLocation.value).toBe('Sítio Boa Vista: -19.31, -43.71');
    expect(el().textContent).toContain('Local marcado: Sítio Boa Vista · -19.31, -43.71');
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
      noNumber: false,
      complement: '',
      directions: '',
      mapLocation: '',
    });
    pressNext();
    expect(moved).toHaveLength(1);
    expect(message()).toBeUndefined();
  });
});
