import { describe, expect, it } from 'vitest';
import { buildGuestListDocument, guestListPeopleCount } from './guest-list-document.utils';
import type { GuestHousehold } from './guest-households.utils';

const household = (extra: Partial<GuestHousehold>): GuestHousehold => ({
  id: 'h',
  name: 'Jéssica',
  phone: '',
  people: [],
  bring: [],
  members: [],
  ...extra,
});

const event = {
  title: 'Natal <da> família',
  date: '2026-12-24T19:00:00-03:00',
  location: 'Rua das Palmeiras, 100 - Centro',
};

describe('buildGuestListDocument', () => {
  const households = [
    household({ name: 'Jéssica Melo', phone: '(31) 99258-1290', people: ['Ana', 'Bia'] }),
    household({ id: 'h2', name: 'Luiz', bring: ['2 kg de Arroz'] }),
  ];

  it('counts each household and who comes along', () => {
    expect(guestListPeopleCount(households)).toBe(4);
  });

  it('lays out the event, the totals and one row per household, text escaped', () => {
    const html = buildGuestListDocument({
      event,
      households,
      hasItems: true,
      generatedAt: new Date(2026, 11, 1, 10, 5),
    });
    expect(html).toContain('Natal &lt;da&gt; família');
    expect(html).not.toContain('<da>');
    expect(html).toContain('2 famílias');
    expect(html).toContain('4 pessoas');
    expect(html).toContain('(31) 99258-1290');
    expect(html).toContain('Ana<br />Bia');
    expect(html).toContain('2 kg de Arroz');
    expect(html).toContain('<th>O que leva</th>');
    expect(html).toContain('Gerado em 01/12/2026 às 10:05');
  });

  it('leaves out "O que leva" when the event has no items', () => {
    const html = buildGuestListDocument({ event, households, hasItems: false });
    expect(html).not.toContain('O que leva');
    expect(html).toContain('Só a pessoa');
  });
});
