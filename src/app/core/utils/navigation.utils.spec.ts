import { describe, expect, it } from 'vitest';
import { isPrimaryDestination, resolveBackRoute, showsBottomNav } from './navigation.utils';

describe('navigation utils', () => {
  it('treats Início, Meus eventos and Perfil as primary destinations', () => {
    expect(isPrimaryDestination('/')).toBe(true);
    expect(isPrimaryDestination('/meus-eventos')).toBe(true);
    expect(isPrimaryDestination('/meus-eventos/?filtro=futuros')).toBe(true);
    expect(isPrimaryDestination('/perfil#familia')).toBe(true);
    expect(isPrimaryDestination('/evento/abc')).toBe(false);
  });

  it('shows the bottom bar on its destinations and on an event page, not in the editor', () => {
    expect(showsBottomNav('/')).toBe(true);
    expect(showsBottomNav('/perfil')).toBe(true);
    expect(showsBottomNav('/evento/abc')).toBe(true);
    expect(showsBottomNav('/evento/abc?convite=1')).toBe(true);
    expect(showsBottomNav('/meus-eventos/evento/abc')).toBe(false);
    expect(showsBottomNav('/amigo-oculto/xyz')).toBe(false);
  });

  it('sends sub-pages back to their parent destination', () => {
    expect(resolveBackRoute('/evento/abc')).toBe('/');
    expect(resolveBackRoute('/meus-eventos/evento/novo')).toBe('/meus-eventos');
    expect(resolveBackRoute('/meus-eventos/evento/abc')).toBe('/evento/abc');
    expect(resolveBackRoute('/meus-eventos/evento/abc?passo=2')).toBe('/evento/abc');
    expect(resolveBackRoute('/admin')).toBe('/perfil');
  });

  it('has no back arrow on primary destinations, login or the design system', () => {
    expect(resolveBackRoute('/')).toBeNull();
    expect(resolveBackRoute('/perfil')).toBeNull();
    expect(resolveBackRoute('/login')).toBeNull();
    expect(resolveBackRoute('/design-system#colors')).toBeNull();
  });
});
