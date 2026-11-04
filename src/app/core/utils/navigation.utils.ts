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
 * Where the header back arrow leads from a sub-page, or null on primary
 * destinations and on screens with their own navigation (login, design system).
 */
export function resolveBackRoute(url: string): string | null {
  const path = pathOf(url);
  if (isPrimaryDestination(path) || path === '/login' || path.startsWith('/design-system')) {
    return null;
  }
  if (path.startsWith('/meus-eventos/')) {
    return '/meus-eventos';
  }
  if (path.startsWith('/admin')) {
    return '/perfil';
  }
  return '/';
}
