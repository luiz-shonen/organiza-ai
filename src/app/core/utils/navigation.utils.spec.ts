import { describe, expect, it } from 'vitest';
import { isPrimaryDestination, resolveBackRoute } from './navigation.utils';

describe('navigation utils', () => {
  it('treats Início, Meus eventos and Perfil as primary destinations', () => {
    expect(isPrimaryDestination('/')).toBe(true);
    expect(isPrimaryDestination('/meus-eventos')).toBe(true);
    expect(isPrimaryDestination('/meus-eventos/?filtro=futuros')).toBe(true);
    expect(isPrimaryDestination('/perfil#familia')).toBe(true);
    expect(isPrimaryDestination('/evento/abc')).toBe(false);
  });

  it('sends sub-pages back to their parent destination', () => {
    expect(resolveBackRoute('/evento/abc')).toBe('/');
    expect(resolveBackRoute('/meus-eventos/evento/novo')).toBe('/meus-eventos');
    expect(resolveBackRoute('/meus-eventos/evento/abc?passo=2')).toBe('/meus-eventos');
    expect(resolveBackRoute('/admin')).toBe('/perfil');
  });

  it('has no back arrow on primary destinations, login or the design system', () => {
    expect(resolveBackRoute('/')).toBeNull();
    expect(resolveBackRoute('/perfil')).toBeNull();
    expect(resolveBackRoute('/login')).toBeNull();
    expect(resolveBackRoute('/design-system#colors')).toBeNull();
  });
});
