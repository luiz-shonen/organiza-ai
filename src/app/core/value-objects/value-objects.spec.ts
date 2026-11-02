import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  AddressNumber,
  Cep,
  Email,
  EventCategory,
  EventDateTime,
  EventDescription,
  EventTitle,
  ItemName,
  PersonName,
  PixKey,
  Quantity,
  fieldError,
  normalizePlainText,
  notInPast,
  requiredText,
  validDate,
  valueObjectValidator,
} from './index';

describe('PersonName', () => {
  it.each([
    'Ana',
    'Maria da Silva',
    'Jean-Luc Picard',
    "D'Ávila",
    'José Jr.',
    'J. R. Tolkien',
    'Zé',
  ])('accepts %s', (name) => {
    expect(PersonName.validate(name)).toBeNull();
    expect(PersonName.create(name)?.value).toBe(name);
  });

  it('tidies spaces', () => {
    expect(PersonName.create('  Maria   da  Silva ')?.value).toBe('Maria da Silva');
  });

  it.each([
    ['A', 'Use pelo menos 2 letras'],
    ['Ana123', 'Use só letras, espaços, hífen ou apóstrofo'],
    ['<script>alert(1)</script>', 'Use só letras, espaços, hífen ou apóstrofo'],
    ['Ana -- Silva', 'Use só letras, espaços, hífen ou apóstrofo'],
    ['a'.repeat(81), 'Use no máximo 80 caracteres'],
  ])('rejects %s', (name, message) => {
    expect(PersonName.validate(name)).toBe(message);
    expect(PersonName.create(name)).toBeNull();
  });

  it('leaves empty text to required', () => {
    expect(PersonName.validate('   ')).toBeNull();
    expect(PersonName.create('   ')).toBeNull();
  });
});

describe('Email', () => {
  it('accepts and lowercases a valid address', () => {
    expect(Email.create(' Ana@Exemplo.com ')?.value).toBe('ana@exemplo.com');
  });

  it.each(['ana', 'ana@', 'ana@exemplo', 'ana @exemplo.com', '<a>@b.com', 'ana@exemplo.c'])(
    'rejects %s',
    (email) => {
      expect(Email.validate(email)).toBe(Email.INVALID_MESSAGE);
    },
  );
});

describe('EventTitle, EventDescription and ItemName', () => {
  it('accepts ordinary text and normalizes it', () => {
    expect(EventTitle.create('  Festa   Junina 2026 ')?.value).toBe('Festa Junina 2026');
    expect(ItemName.create('Refrigerante 2L')?.value).toBe('Refrigerante 2L');
  });

  it('keeps line breaks in descriptions', () => {
    expect(EventDescription.create('Traga   seu prato.\r\n\r\n\r\nAté lá!')?.value).toBe(
      'Traga seu prato.\n\nAté lá!',
    );
  });

  it('refuses markup, symbol-only text and lengths out of range', () => {
    expect(EventTitle.validate('<b>Festa</b>')).toBe('Não use os caracteres < > { }');
    expect(EventTitle.validate('{{ 7*7 }}')).toBe('Não use os caracteres < > { }');
    expect(ItemName.validate('!!!')).toBe('Use letras ou números');
    expect(EventTitle.validate('Oi')).toBe('Use pelo menos 3 caracteres');
    expect(EventDescription.validate('Oi!')).toBe('Use pelo menos 5 caracteres');
    expect(ItemName.validate('x'.repeat(61))).toBe('Use no máximo 60 caracteres');
  });

  it('drops control characters', () => {
    expect(normalizePlainText('Bolo\u0000 de\u0007 milho')).toBe('Bolo de milho');
  });
});

describe('EventCategory', () => {
  it('accepts a typed category and tidies it', () => {
    expect(EventCategory.create('  Chá   revelação ')?.value).toBe('Chá revelação');
  });

  it('refuses markup and lengths out of range', () => {
    expect(EventCategory.validate('<b>')).toBe('Não use os caracteres < > { }');
    expect(EventCategory.validate('A')).toBe('Use pelo menos 2 caracteres');
    expect(EventCategory.validate('x'.repeat(41))).toBe('Use no máximo 40 caracteres');
  });
});

describe('Cep and AddressNumber', () => {
  it('validates and masks a CEP', () => {
    expect(Cep.validate('01310-100')).toBeNull();
    expect(Cep.create('01310100')?.formatted).toBe('01310-100');
    expect(Cep.validate('0131')).toBe(Cep.INVALID_MESSAGE);
    expect(Cep.validate('01310-10a')).toBe(Cep.INVALID_MESSAGE);
    expect(Cep.mask('01310100999')).toBe('01310-100');
  });

  it.each(['123', '12A', 's/n', 'SN'])('accepts the number %s', (value) => {
    expect(AddressNumber.validate(value)).toBeNull();
  });

  it('normalizes S/N and rejects text', () => {
    expect(AddressNumber.create('sn')?.value).toBe('S/N');
    expect(AddressNumber.validate('Rua 5')).toBe(AddressNumber.INVALID_MESSAGE);
    expect(AddressNumber.validate('1234567')).toBe(AddressNumber.INVALID_MESSAGE);
  });
});

describe('PixKey', () => {
  it.each([
    ['529.982.247-25', 'cpf'],
    ['11.222.333/0001-81', 'cnpj'],
    ['pix@exemplo.com', 'email'],
    ['+55 11 98888-1111', 'phone'],
    ['123e4567-e89b-42d3-a456-426614174000', 'random'],
  ])('recognizes %s as %s', (key, type) => {
    expect(PixKey.create(key)?.type).toBe(type);
  });

  it.each(['123', '111.111.111-11', 'chave qualquer', 'pix@'])('rejects %s', (key) => {
    expect(PixKey.validate(key)).toBe(PixKey.INVALID_MESSAGE);
  });
});

describe('Quantity', () => {
  it('accepts whole numbers from 1 to 999', () => {
    expect(Quantity.create('1')?.value).toBe(1);
    expect(Quantity.create(999)?.value).toBe(999);
  });

  it.each(['0', '1000', '1.5', '-2', 'abc'])('rejects %s', (value) => {
    expect(Quantity.validate(value)).toBe(Quantity.INVALID_MESSAGE);
  });
});

describe('form helpers', () => {
  it('reports the value object message once the field is touched', () => {
    const control = new FormControl('A', [requiredText, valueObjectValidator(PersonName.validate)]);
    expect(fieldError(control, 'Nome é obrigatório')).toBe('');

    control.markAsTouched();
    expect(fieldError(control, 'Nome é obrigatório')).toBe('Use pelo menos 2 letras');

    control.setValue('   ');
    expect(fieldError(control, 'Nome é obrigatório')).toBe('Nome é obrigatório');

    control.setValue('Ana');
    expect(fieldError(control, 'Nome é obrigatório')).toBe('');
  });

  it('lets empty values pass the value object check', () => {
    const control = new FormControl('', [valueObjectValidator(PixKey.validate)]);
    expect(control.valid).toBe(true);
    const required = new FormControl('', [Validators.required]);
    expect(required.valid).toBe(false);
  });
});

describe('EventDateTime', () => {
  const now = new Date(2026, 10, 2, 12, 0);

  it('combines a date and a time and refuses the past', () => {
    expect(EventDateTime.combine(new Date(2026, 10, 10), '19:30')).toEqual(
      new Date(2026, 10, 10, 19, 30),
    );
    expect(EventDateTime.create(new Date(2026, 10, 10), '19:30', now)).not.toBeNull();
    expect(EventDateTime.create(new Date(2026, 10, 2), '11:59', now)).toBeNull();
    expect(EventDateTime.combine(new Date(NaN), '19:30')).toBeNull();
  });

  it('flags typed text that is not a date and a date and time before now', () => {
    expect(validDate(new FormControl(new Date(NaN)))).toEqual({ invalidDate: true });
    expect(validDate(new FormControl(new Date(2026, 10, 10)))).toBeNull();

    const group = new FormGroup({
      date: new FormControl<Date | null>(new Date(2026, 10, 2)),
      time: new FormControl('11:00'),
    });
    expect(notInPast(() => now)(group)).toEqual({ pastDateTime: true });
    group.controls.time.setValue('13:00');
    expect(notInPast(() => now)(group)).toBeNull();
  });
});
