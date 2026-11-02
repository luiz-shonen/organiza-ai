import { describe, expect, it } from 'vitest';
import { Phone } from './phone';

describe('Phone', () => {
  it('accepts a mobile number and formats it', () => {
    expect(Phone.create('11988881111')?.formatted).toBe('(11) 98888-1111');
    expect(Phone.create('(31) 99999-9999')?.digits).toBe('31999999999');
  });

  it('accepts a landline number', () => {
    expect(Phone.create('1133334444')?.formatted).toBe('(11) 3333-4444');
  });

  it('drops a leading +55', () => {
    expect(Phone.create('+55 11 98888-1111')?.formatted).toBe('(11) 98888-1111');
  });

  it.each([
    ['', 'empty'],
    ['119888', 'too short'],
    ['319923123123213123123123123123123', 'too long'],
    ['0198888111', 'DDD starting with 0'],
    ['11888881111', '11 digits without the mobile 9'],
    ['1198888111', '10 digits starting with 9'],
  ])('rejects %s (%s)', (raw) => {
    expect(Phone.create(raw)).toBeNull();
    expect(Phone.isValid(raw)).toBe(false);
  });

  it('masks progressively while typing and stops at 11 digits', () => {
    expect(Phone.mask('1')).toBe('(1');
    expect(Phone.mask('11')).toBe('(11');
    expect(Phone.mask('119')).toBe('(11) 9');
    expect(Phone.mask('1198888')).toBe('(11) 9888-8');
    expect(Phone.mask('1133334444')).toBe('(11) 3333-4444');
    expect(Phone.mask('11988881111')).toBe('(11) 98888-1111');
    expect(Phone.mask('11988881111999')).toBe('(11) 98888-1111');
    expect(Phone.mask('ab11c')).toBe('(11');
  });

  it('displays saved values that are not valid as they are', () => {
    expect(Phone.display('11988881111')).toBe('(11) 98888-1111');
    expect(Phone.display('123')).toBe('123');
    expect(Phone.display(undefined)).toBe('');
  });

  it('compares by digits', () => {
    expect(Phone.create('11988881111')?.equals(Phone.create('(11) 98888-1111'))).toBe(true);
    expect(Phone.create('11988881111')?.equals(null)).toBe(false);
  });
});
