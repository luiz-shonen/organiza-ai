import { describe, expect, it } from 'vitest';
import { buildGuestListPdf, guestListPdfName } from './guest-list-pdf';
import type { GuestHousehold } from '../../core/utils/guest-households.utils';

const household = (name: string, extra: Partial<GuestHousehold> = {}): GuestHousehold => ({
  id: name,
  name,
  phone: '(31) 99258-1290',
  people: ['Luiz'],
  bring: ['2 kg de Arroz'],
  members: [],
  ...extra,
});

const event = {
  title: 'Natal 2026 da família',
  date: '2026-12-24T19:00:00-03:00',
  location: 'Rua Dom Lara, 135 - Belo Horizonte/MG',
};

describe('buildGuestListPdf', () => {
  it('names the file after the event, without accents', () => {
    expect(guestListPdfName('Natal 2026 da família!')).toBe(
      'confirmados-natal-2026-da-familia.pdf',
    );
    expect(guestListPdfName('  ')).toBe('confirmados-evento.pdf');
  });

  it('fits a short list on one A4 page, with the event and every household', () => {
    const doc = buildGuestListPdf({
      event,
      households: [household('Jéssica Melo'), household('Marli', { people: [], bring: [] })],
      hasItems: true,
    });
    expect(doc.getNumberOfPages()).toBe(1);
    const text = doc.output();
    expect(text).toContain('Natal 2026 da fam');
    expect(text).toContain('Marli');
    expect(text).toContain('O QUE LEVA');
  });

  it('runs a long list over more pages, the header row on each', () => {
    const doc = buildGuestListPdf({
      event,
      households: Array.from({ length: 40 }, (_, i) => household(`Pessoa ${i + 1}`)),
      hasItems: false,
    });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const text = doc.output();
    expect(text.match(/QUEM CONFIRMOU/g)?.length).toBe(doc.getNumberOfPages());
    expect(text).not.toContain('O QUE LEVA');
    expect(text).toContain(`de ${doc.getNumberOfPages()}`);
  });
});
