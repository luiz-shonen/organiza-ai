import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RsvpDrawerComponent } from './rsvp-drawer.component';
import { FamilyService } from '../../../../core/services/family.service';

describe('RsvpDrawerComponent', () => {
  let component: RsvpDrawerComponent;
  let fixture: ComponentFixture<RsvpDrawerComponent>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [RsvpDrawerComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: { session: { name: 'Carlos', phone: '11999998888' } } },
        { provide: FamilyService, useValue: { addFamilyMember: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RsvpDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reveals exactly the requested ordered companion fields with accessible labels', () => {
    const countInput = fixture.nativeElement.querySelector('[data-testid="rsvp-companions-input"]') as HTMLInputElement;
    countInput.value = '3';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('[formarrayname="companions"] input');
    expect(inputs).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('Acompanhante 1');
    expect(fixture.nativeElement.textContent).toContain('Acompanhante 3');
  });

  it('prevents submission and identifies a blank revealed companion', () => {
    const countInput = fixture.nativeElement.querySelector('[data-testid="rsvp-companions-input"]') as HTMLInputElement;
    countInput.value = '1';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Nome do acompanhante é obrigatório');
  });

  it('returns ordered named companions and selected family members only when valid', () => {
    const countInput = fixture.nativeElement.querySelector('[data-testid="rsvp-companions-input"]') as HTMLInputElement;
    countInput.value = '2';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('[formarrayname="companions"] input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = ' Ana ';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'Bia';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();

    expect(close).toHaveBeenCalledWith(expect.objectContaining({
      companions: [{ name: 'Ana' }, { name: 'Bia' }],
    }));
  });

  it('rejects a companion count greater than ten', () => {
    const countInput = fixture.nativeElement.querySelector('[data-testid="rsvp-companions-input"]') as HTMLInputElement;
    countInput.value = '11';
    countInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="rsvp-confirm-btn"] button').click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informe um número entre 0 e 10');
  });
});
