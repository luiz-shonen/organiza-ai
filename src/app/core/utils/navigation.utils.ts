/** Top-level destinations that show the primary navigation instead of a back arrow. */
const PRIMARY_DESTINATIONS: readonly string[] = ['/', '/meus-eventos', '/perfil'];

function pathOf(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

/** True on the screens reachable from the bottom bar (Início, Meus eventos, Perfil). */
export function isPrimaryDestination(url: string): boolean {
  return PRIMARY_DESTINATIONS.includes(pathOf(url));
}

/**
 * True where the bottom bar shows on a phone: its own destinations and an event's page, so a
 * guest who opened an invite can still reach Início, Meus eventos and Perfil. The editor keeps
 * the screen for its own "Voltar" and "Próximo".
 */
export function showsBottomNav(url: string): boolean {
  const path = pathOf(url);
  return isPrimaryDestination(path) || /^\/evento\/[^/]+$/.test(path);
}

/**
 * Where the header back arrow leads from a sub-page when there is no screen before it in the
 * tab (opened from a link), or null on primary destinations and on screens with their own
 * navigation (login, design system). Otherwise the arrow returns to the screen before.
 */
export function resolveBackRoute(url: string): string | null {
  const path = pathOf(url);
  if (isPrimaryDestination(path) || path === '/login' || path.startsWith('/design-system')) {
    return null;
  }
  // Editing an event that exists: its page. Creating one: Meus eventos.
  const editing = /^\/meus-eventos\/evento\/([^/]+)$/.exec(path);
  if (editing && editing[1] !== 'novo') {
    return `/evento/${editing[1]}`;
  }
  if (path.startsWith('/meus-eventos/')) {
    return '/meus-eventos';
  }
  if (path.startsWith('/admin')) {
    return '/perfil';
  }
  return '/';
}
