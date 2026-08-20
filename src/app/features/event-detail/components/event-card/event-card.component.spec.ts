import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
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
    location: 'Parque Ibirapuera',
    pixKey: 'pix@test.com',
    status: 'active',
    createdBy: 'user-1',
    collaborators: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should accept isOwner input and default to true', () => {
    expect(component.isOwner()).toBe(true);
  });

  it('should generate google calendar url based on event data', () => {
    expect(component.googleCalendarUrl()).toContain('https://calendar.google.com');
    expect(component.googleCalendarUrl()).toContain('Churrasco%20de%20Domingo');
  });
});
