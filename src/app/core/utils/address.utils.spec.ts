import { describe, expect, it } from 'vitest';
import { parseLocation } from './address.utils';

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
