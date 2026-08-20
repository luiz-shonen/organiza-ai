import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventCardComponent } from './event-card.component';
import { PartyEvent } from '../../../../../core/models';

describe('EventCardComponent (Organizer Dashboard)', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  const mockEvent: PartyEvent = {
    id: 'evt-1',
    title: 'Festa da Firma',
    description: 'Confraternização de final de ano',
    date: '2026-12-20T19:00:00.000Z',
    location: 'Espaço Jardim',
    pixKey: 'empresa@pix.com',
    status: 'active',
    createdBy: 'user-1',
    collaborators: ['user-2'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render "Organizador" badge when isOwner is true', () => {
    fixture.componentRef.setInput('isOwner', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.org-event-card__role-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Organizador');
    expect(badge?.classList.contains('org-event-card__role-badge--owner')).toBe(true);

    // Cancel button should be present for owner
    const cancelBtn = compiled.querySelector('button[mattooltip="Cancelar"]');
    expect(cancelBtn).toBeTruthy();
  });

  it('should render "Colaborador" badge and hide cancel button when isOwner is false', () => {
    fixture.componentRef.setInput('isOwner', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.org-event-card__role-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Colaborador');
    expect(badge?.classList.contains('org-event-card__role-badge--collaborator')).toBe(true);

    // Cancel button should be hidden for collaborator
    const cancelBtn = compiled.querySelector('button[mattooltip="Cancelar"]');
    expect(cancelBtn).toBeNull();
  });

  it('should emit action outputs when buttons are clicked', () => {
    const editSpy = vi.fn();
    const shareSpy = vi.fn();
    const copySpy = vi.fn();
    const cancelSpy = vi.fn();
    const selectSpy = vi.fn();

    component.edit.subscribe(editSpy);
    component.share.subscribe(shareSpy);
    component.copyLink.subscribe(copySpy);
    component.cancel.subscribe(cancelSpy);
    component.select.subscribe(selectSpy);

    const dummyEvent = new MouseEvent('click');

    component.onEdit(dummyEvent);
    expect(editSpy).toHaveBeenCalledWith(mockEvent);

    component.onShare(dummyEvent);
    expect(shareSpy).toHaveBeenCalledWith(mockEvent);

    component.onCopyLink(dummyEvent);
    expect(copySpy).toHaveBeenCalledWith(mockEvent);

    component.onCancel(dummyEvent);
    expect(cancelSpy).toHaveBeenCalledWith(mockEvent);

    component.onCardClick();
    expect(selectSpy).toHaveBeenCalledWith(mockEvent);
  });
});
