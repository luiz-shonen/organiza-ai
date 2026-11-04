import { describe, expect, it } from 'vitest';
import { addressLines, parseLocation } from './address.utils';

describe('parseLocation', () => {
  it('splits the line the editor saves into the address fields', () => {
    expect(
      parseLocation('Rua Dom Lara, 135 - Vista Alegre - Belo Horizonte/MG - CEP: 30514-160'),
    ).toEqual({
      address: 'Rua Dom Lara',
      number: '135',
      neighborhood: 'Vista Alegre',
      city: 'Belo Horizonte/MG',
      cep: '30514-160',
    });
  });

  it('leaves what is missing empty', () => {
    expect(parseLocation('Espaço Gourmet')).toEqual({
      address: 'Espaço Gourmet',
      number: '',
      neighborhood: '',
      city: '',
      cep: '',
    });
    expect(parseLocation(undefined).address).toBe('');
  });
});

describe('addressLines', () => {
  it('puts street and neighbourhood above city and CEP', () => {
    expect(
      addressLines('Rua Dom Lara, 135 - Vista Alegre - Belo Horizonte/MG - CEP: 30514-160'),
    ).toEqual({
      street: 'Rua Dom Lara, 135 · Vista Alegre',
      area: 'Belo Horizonte/MG · 30514-160',
    });
  });

  it('prefers the saved fields and skips what is missing', () => {
    expect(
      addressLines('ignored', {
        address: 'Av. Afonso Pena',
        number: '1500',
        city: 'Belo Horizonte/MG',
      }),
    ).toEqual({ street: 'Av. Afonso Pena, 1500', area: 'Belo Horizonte/MG' });
    expect(addressLines('Espaço Gourmet')).toEqual({ street: 'Espaço Gourmet', area: '' });
  });
});
