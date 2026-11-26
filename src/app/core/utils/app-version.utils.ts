import type { AppVersion } from '../../../environments/firebase-config';

/**
 * The super admins' footer: "Versão 42 · 3777074 · 25/11 20:30" (deploy time in the viewer's
 * clock). Without a deployed version (running locally): "Versão local".
 */
export function formatAppVersion(app: AppVersion | null): string {
  if (!app?.version) return 'Versão local';
  const parts = [`Versão ${app.version}`];
  if (app.commit) parts.push(app.commit);
  const at = app.deployedAt ? new Date(app.deployedAt) : null;
  if (at && !isNaN(at.getTime())) {
    parts.push(
      at.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  }
  return parts.join(' · ');
}
