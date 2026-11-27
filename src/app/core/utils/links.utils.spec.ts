import { describe, expect, it } from 'vitest';
import { isShortenedLink, linkHost, splitLinks } from './links.utils';

describe('splitLinks', () => {
  it('finds the links in a gift idea, keeping the words around them', () => {
    expect(
      splitLinks('Conjunto de chaves 50 em 1 https://a.aliexpress.com/_mL9ANa tamanho M'),
    ).toEqual([
      { text: 'Conjunto de chaves 50 em 1 ' },
      { text: 'https://a.aliexpress.com/_mL9ANa', url: 'https://a.aliexpress.com/_mL9ANa' },
      { text: ' tamanho M' },
    ]);
  });

  it('leaves the sentence punctuation out of the link and accepts www.', () => {
    expect(splitLinks('veja www.loja.com.br/x.')).toEqual([
      { text: 'veja ' },
      { text: 'www.loja.com.br/x', url: 'https://www.loja.com.br/x' },
      { text: '.' },
    ]);
  });

  it('keeps plain text as it is', () => {
    expect(splitLinks('Gift card Nintendo')).toEqual([{ text: 'Gift card Nintendo' }]);
    expect(splitLinks('javascript:alert(1)')).toEqual([{ text: 'javascript:alert(1)' }]);
  });
});

describe('linkHost and isShortenedLink', () => {
  it('names the site a link opens', () => {
    expect(linkHost('https://www.amazon.com.br/dp/1')).toBe('amazon.com.br');
    expect(linkHost('https://vt.tiktok.com/ZS9/')).toBe('vt.tiktok.com');
  });

  it('spots links that hide the real site', () => {
    expect(isShortenedLink('https://bit.ly/abc')).toBe(true);
    expect(isShortenedLink('https://a.aliexpress.com/_m')).toBe(false);
  });
});
