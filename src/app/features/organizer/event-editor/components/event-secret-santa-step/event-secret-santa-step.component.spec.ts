import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventSecretSantaStepComponent } from './event-secret-santa-step.component';

describe('EventSecretSantaStepComponent', () => {
  let fixture: ComponentFixture<EventSecretSantaStepComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string) => el().querySelector(`[data-testid="${id}"]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSecretSantaStepComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EventSecretSantaStepComponent);
    fixture.detectChanges();
  });

  it('asks "Vai ter amigo oculto?" and only its settings: the people are on the event page', () => {
    expect(el().textContent).toContain('Vai ter amigo oculto?');
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();
    expect(el().textContent).toContain('Incluir opções de presente');
    expect(el().textContent).toContain('você acompanha os participantes');
    expect(byTestId('secret-santa-manual')).toBeNull();
    expect(byTestId('secret-santa-participants')).toBeNull();
  });

  it('keeps the switches locked for collaborators', () => {
    fixture.componentRef.setInput('canConfigure', false);
    fixture.detectChanges();
    const toggle = el().querySelector(
      '[data-testid="secret-santa-toggle"] button, button[role="switch"]',
    ) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
  });
});
