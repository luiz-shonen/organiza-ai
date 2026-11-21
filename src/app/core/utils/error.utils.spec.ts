import { describe, it, expect, vi } from 'vitest';
import { errorReason, explainError } from './error.utils';

const firebaseError = (code: string) => Object.assign(new Error(`Firebase: ${code}`), { code });

describe('error.utils', () => {
  it('says why a Firebase call failed, in plain words', () => {
    expect(errorReason(firebaseError('permission-denied'))).toBe(
      'o servidor recusou por falta de permissão',
    );
    expect(errorReason(new Error('Missing or insufficient permissions.'))).toBe(
      'o servidor recusou por falta de permissão',
    );
    expect(errorReason(firebaseError('unavailable'))).toBe(
      'sem conexão com o servidor, confira a internet',
    );
    expect(errorReason(firebaseError('unauthenticated'))).toBe('sua sessão expirou, entre de novo');
    expect(errorReason(firebaseError('not-found'))).toContain('não existe mais');
    expect(errorReason(firebaseError('firestore/aborted'))).toBe('erro do servidor (aborted)');
    expect(errorReason(new Error('boom'))).toBe('erro inesperado (boom)');
    expect(errorReason(undefined)).toBe('erro inesperado');
  });

  it('puts the action first and the reason after, without "Tente novamente"', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      explainError('Não foi possível salvar. Tente novamente.', firebaseError('permission-denied')),
    ).toBe('Não foi possível salvar: o servidor recusou por falta de permissão.');
    expect(explainError('Não foi possível adicionar o participante', new Error('x'))).toBe(
      'Não foi possível adicionar o participante: erro inesperado (x).',
    );
  });
});
