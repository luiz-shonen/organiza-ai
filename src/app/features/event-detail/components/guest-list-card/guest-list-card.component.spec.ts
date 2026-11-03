import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { GuestHousehold } from '../../../../core/utils';
import { GuestListCardComponent } from './guest-list-card.component';

const households: GuestHousehold[] = [
  {
    id: 'u1',
    name: 'Jéssica',
    phone: '(31) 99267-7624',
    people: ['Soraya', 'Marcos'],
    bring: ['2 kg de Carne'],
  },
  { id: 'u2', name: 'Fernanda', phone: '', people: [], bring: [] },
];

async function render(forOrganizer: boolean) {
  await TestBed.configureTestingModule({ imports: [GuestListCardComponent] }).compileComponents();
  const fixture = TestBed.createComponent(GuestListCardComponent);
  fixture.componentRef.setInput('households', households);
  fixture.componentRef.setInput('forOrganizer', forOrganizer);
  fixture.componentRef.setInput('declines', [
    { id: 'u3', name: 'Ana', message: 'Vou estar viajando.', declinedAt: '' },
  ]);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('GuestListCardComponent', () => {
  it('shows every guest who comes with them and what they bring, without phones', async () => {
    const element = await render(false);
    const text = element.textContent ?? '';

    expect(text).toContain('2 confirmados · 4 pessoas');
    expect(text).toContain('Soraya, Marcos');
    expect(text).toContain('2 kg de Carne');
    expect(text).not.toContain('99267');
    expect(text).not.toContain('Não poderão ir');
    expect(text).not.toContain('Excel');
  });

  it('adds phones, the declines and the export for organizers', async () => {
    const text = (await render(true)).textContent ?? '';

    expect(text).toContain('(31) 99267-7624');
    expect(text).toContain('Não poderão ir (1)');
    expect(text).toContain('Vou estar viajando.');
    expect(text).toContain('Excel');
  });
});
