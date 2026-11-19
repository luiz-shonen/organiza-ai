import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationCardComponent } from './notification-card.component';
import type { AppNotification } from '../../../core/models';

describe('NotificationCardComponent', () => {
  let fixture: ComponentFixture<NotificationCardComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const press = (testId: string) =>
    (
      el().querySelector(
        `[data-testid="${testId}"] button, button[data-testid="${testId}"]`,
      ) as HTMLButtonElement
    ).click();

  const notice: AppNotification = {
    id: 'secret-santa_e',
    kind: 'secret-santa',
    eventId: 'e',
    eventTitle: 'Natal 2026',
    title: 'Sorteio do amigo oculto feito!',
    body: 'O sorteio do amigo oculto de Natal 2026 foi feito.',
    actionLabel: 'Ver quem eu tirei',
    actionUrl: '/amigo-oculto/tok',
    createdAt: '2026-11-16',
    readAt: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationCardComponent);
    fixture.componentRef.setInput('notification', notice);
    fixture.detectChanges();
  });

  it('shows the notice with its action, and emits on open and dismiss', () => {
    const opened: AppNotification[] = [];
    const dismissed: AppNotification[] = [];
    fixture.componentInstance.opened.subscribe((n) => opened.push(n));
    fixture.componentInstance.dismissed.subscribe((n) => dismissed.push(n));

    expect(el().textContent).toContain('Sorteio do amigo oculto feito!');
    expect(el().textContent).toContain('Ver quem eu tirei');
    press('notification-action-btn');
    press('notification-dismiss-btn');
    expect(opened).toEqual([notice]);
    expect(dismissed).toEqual([notice]);
  });

  it('once read, says so instead of offering the action again', () => {
    fixture.componentRef.setInput('notification', { ...notice, readAt: '2026-11-16' });
    fixture.componentRef.setInput('readNote', 'Você já abriu seu resultado.');
    fixture.componentRef.setInput('dismissible', false);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="notification-read-note"]')?.textContent).toContain(
      'Você já abriu seu resultado.',
    );
    expect(el().querySelector('[data-testid="notification-action-btn"]')).toBeNull();
    expect(el().querySelector('[data-testid="notification-dismiss-btn"]')).toBeNull();
  });
});
