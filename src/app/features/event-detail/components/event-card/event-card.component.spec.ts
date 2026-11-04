import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventCardComponent } from './event-card.component';
import { PartyEvent } from '../../../../core/models';

describe('EventCardComponent (Event Detail)', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  const mockEvent: PartyEvent = {
    id: 'evt-10',
    title: 'Churrasco de Domingo',
    description: 'Traga sua bebida',
    date: '2026-11-15T13:00:00.000Z',
    location: 'Rua Dom Lara, 135 - Vista Alegre - Belo Horizonte/MG - CEP: 30514-160',
    pixKey: 'pix@test.com',
    status: 'active',
    createdBy: 'user-1',
    creatorEmail: 'jessica@example.com',
    collaborators: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('renders the title as the page heading', () => {
    expect(element().querySelector('h1.event-card__title')?.textContent).toContain(
      'Churrasco de Domingo',
    );
  });

  it('links to Google Calendar with the event data', () => {
    const link = element().querySelector('.event-card__date-sub') as HTMLAnchorElement;
    expect(link.href).toContain('https://calendar.google.com');
    expect(link.href).toContain('Churrasco%20de%20Domingo');
  });

  it('splits the address into street and the rest', () => {
    const text = element().querySelector('.event-card__location-text')?.textContent ?? '';
    expect(text).toContain('Rua Dom Lara, 135');
    expect(text).toContain('Vista Alegre · Belo Horizonte/MG · 30514-160');
  });

  it('shows the category, falling back to "Evento"', () => {
    expect(element().querySelector('.event-card__category-badge')?.textContent?.trim()).toBe(
      'Evento',
    );
    fixture.componentRef.setInput('event', { ...mockEvent, category: 'Churrasco' });
    fixture.detectChanges();
    expect(element().querySelector('.event-card__category-badge')?.textContent?.trim()).toBe(
      'Churrasco',
    );
  });

  it('names the organiser, or "Você" for the owner', () => {
    expect(element().querySelector('.event-card__host-name')?.textContent).toContain('jessica');
    fixture.componentRef.setInput('isOwner', true);
    fixture.detectChanges();
    expect(element().querySelector('.event-card__host-name')?.textContent).toContain('Você');
  });

  it("prefers the organizer's saved name and shows the viewer's initial when it is them", () => {
    fixture.componentRef.setInput('event', { ...mockEvent, creatorName: 'Jéssica Souza' });
    fixture.detectChanges();
    expect(element().querySelector('.event-card__host-name')?.textContent).toContain(
      'Jéssica Souza',
    );

    fixture.componentRef.setInput('event', { ...mockEvent, creatorEmail: '', creatorName: '' });
    fixture.componentRef.setInput('isOwner', true);
    fixture.componentRef.setInput('viewerName', 'Luiz Rodrigues');
    fixture.detectChanges();
    expect(element().querySelector('.event-card__host-name')?.textContent).toContain('Você');
    expect(element().querySelector('.event-card__host org-avatar')?.textContent).toContain('L');
  });

  it('offers "Editar evento" only to people who can edit', () => {
    expect(element().querySelector('[data-testid="edit-event-btn"]')).toBeNull();

    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    const editSpy = vi.fn();
    component.edit.subscribe(editSpy);
    (element().querySelector('button[data-testid="edit-event-btn"]') as HTMLButtonElement).click();
    expect(editSpy).toHaveBeenCalled();
  });
});
