import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it } from 'vitest';
import type { Guest } from '../../../../../core/models';
import { EventGuestsCardComponent } from './event-guests-card.component';

const GUESTS = [
  { id: 'g1', name: 'Ana', phone: '11988887777', companionsCount: 2 },
  { id: 'g2', name: 'Bruno', companions: [{ name: 'Caio' }] },
  { id: 'g3', name: 'Carla' },
] as Guest[];

describe('EventGuestsCardComponent', () => {
  it('counts everyone coming and fills the phone and companions columns', async () => {
    await TestBed.configureTestingModule({
      imports: [EventGuestsCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(EventGuestsCardComponent);
    fixture.componentRef.setInput('guests', GUESTS);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('3 confirmados · 6 pessoas');
    expect(text).toContain('(11) 98888-7777');
    expect(text).toContain('+2');
    expect(text).toContain('+1');
    expect(text).toContain('—');
  });
});
