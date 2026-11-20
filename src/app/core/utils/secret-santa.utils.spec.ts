import { describe, expect, it } from 'vitest';
import {
  giftSearchLinks,
  buildSecretSantaMessage,
  buildSecretSantaRevealUrl,
  buildSecretSantaWhatsAppUrl,
  drawSecretSanta,
  isSecretSantaDrawOutdated,
  secureRandomInt,
} from './secret-santa.utils';

describe('drawSecretSanta', () => {
  const people = ['Jéssica', 'Luiz', 'Ana', 'Bruno', 'Carla', 'Davi'];

  it('nobody draws themself, and everyone gives and receives once', () => {
    for (let run = 0; run < 200; run++) {
      const pairs = drawSecretSanta(people);
      expect(pairs).toHaveLength(people.length);
      expect(pairs.every((pair) => pair.giver !== pair.receiver)).toBe(true);
      expect(new Set(pairs.map((pair) => pair.giver)).size).toBe(people.length);
      expect(new Set(pairs.map((pair) => pair.receiver)).size).toBe(people.length);
    }
  });

  it('works with two people: they draw each other', () => {
    const pairs = drawSecretSanta(['Ana', 'Bruno']);
    expect(pairs).toEqual(
      expect.arrayContaining([
        { giver: 'Ana', receiver: 'Bruno' },
        { giver: 'Bruno', receiver: 'Ana' },
      ]),
    );
  });

  it('refuses fewer than two people', () => {
    expect(() => drawSecretSanta(['Ana'])).toThrow();
  });

  it('uses the random source it is given', () => {
    // Always 0: the shuffle rotates the list, then each gives to the next.
    const pairs = drawSecretSanta(['A', 'B', 'C'], () => 0);
    expect(pairs).toEqual([
      { giver: 'B', receiver: 'C' },
      { giver: 'C', receiver: 'A' },
      { giver: 'A', receiver: 'B' },
    ]);
  });

  it('varies between draws', () => {
    const results = new Set(
      Array.from({ length: 50 }, () =>
        drawSecretSanta(people)
          .map((p) => `${p.giver}>${p.receiver}`)
          .join(','),
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('secureRandomInt', () => {
  it('stays in range', () => {
    for (let i = 0; i < 500; i++) {
      const value = secureRandomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});

describe('isSecretSantaDrawOutdated', () => {
  it('is false without a draw or when the participants match', () => {
    expect(isSecretSantaDrawOutdated(null, ['a'])).toBe(false);
    expect(isSecretSantaDrawOutdated({ participantIds: ['a', 'b', 'c'] }, ['c', 'a', 'b'])).toBe(
      false,
    );
  });

  it('is true when someone was added or removed', () => {
    expect(isSecretSantaDrawOutdated({ participantIds: ['a', 'b', 'c'] }, ['a', 'b'])).toBe(true);
    expect(isSecretSantaDrawOutdated({ participantIds: ['a', 'b'] }, ['a', 'b', 'c'])).toBe(true);
    expect(isSecretSantaDrawOutdated({ participantIds: ['a', 'b'] }, ['a', 'c'])).toBe(true);
  });
});

describe('secret santa sharing', () => {
  const share = {
    name: 'Jéssica Melo',
    eventTitle: 'Natal 2026 da família',
    url: buildSecretSantaRevealUrl('https://organiza.app', 'tok-1'),
  };

  it('builds the reveal link', () => {
    expect(share.url).toBe('https://organiza.app/amigo-oculto/tok-1');
  });

  it('greets by first name and ends with the link alone', () => {
    const message = buildSecretSantaMessage(share);
    expect(message.startsWith('Olá, *Jéssica*!')).toBe(true);
    expect(message).toContain('*Natal 2026 da família*');
    expect(message.split('\n').at(-1)).toBe(share.url);
    expect(message).toContain('o link só abre uma vez');
    expect(message).toContain('Se precisar, peça um novo link a quem organiza o evento.');
    expect(message).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('names the organizer to ask for a new link', () => {
    const message = buildSecretSantaMessage({ ...share, organizerName: 'Luiz Rodrigues' });
    expect(message).toContain(
      'Se precisar, peça um novo link a Luiz, que organiza o evento. Você continua com a mesma pessoa.',
    );
  });

  it('searches a gift idea on Mercado Livre and Amazon', () => {
    expect(giftSearchLinks('  Chinelo, cor verde,  tamanho 36 ')).toEqual([
      {
        store: 'Mercado Livre',
        icon: '/icons/mercado-livre.svg',
        url: 'https://lista.mercadolivre.com.br/Chinelo%2C-cor-verde%2C-tamanho-36',
      },
      {
        store: 'Amazon',
        icon: '/icons/amazon.svg',
        url: 'https://www.amazon.com.br/s?k=Chinelo%2C%20cor%20verde%2C%20tamanho%2036',
      },
    ]);
    expect(giftSearchLinks('   ')).toEqual([]);
  });

  it('opens the chat with the participant when the phone is valid', () => {
    const url = buildSecretSantaWhatsAppUrl({ ...share, phone: '(11) 98888-1111' });
    expect(url.startsWith('https://api.whatsapp.com/send?phone=5511988881111&text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain(share.url);
  });

  it('lets WhatsApp ask whom to send to when there is no phone', () => {
    const url = buildSecretSantaWhatsAppUrl({ ...share, phone: '' });
    expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
  });
});
