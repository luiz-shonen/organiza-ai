/**
 * Error messages that say why something failed, never only "Erro ao …".
 * Firebase errors carry a `code` ("permission-denied", "unavailable"…); each one is said in
 * plain words, and anything else names its code so it can be looked up.
 */

/** Why it failed, in plain words: "o servidor recusou por falta de permissão". */
export function errorReason(error: unknown): string {
  const code = String((error as { code?: unknown } | null)?.code ?? '');
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const text = `${code} ${message}`;
  if (/permission-denied|insufficient permissions/i.test(text)) {
    return 'o servidor recusou por falta de permissão';
  }
  if (/unauthenticated/i.test(text)) return 'sua sessão expirou, entre de novo';
  if (/unavailable|network|offline|failed to fetch/i.test(text)) {
    return 'sem conexão com o servidor, confira a internet';
  }
  if (/deadline-exceeded|timeout/i.test(text)) return 'o servidor demorou demais para responder';
  if (/not-found/i.test(text)) return 'o registro não existe mais (pode ter sido apagado)';
  if (/already-exists/i.test(text)) return 'já existe um registro igual';
  if (/resource-exhausted|quota/i.test(text)) {
    return 'o limite de uso do servidor foi atingido, tente daqui a pouco';
  }
  if (/invalid-argument|failed-precondition/i.test(text)) {
    return 'o servidor recusou os dados enviados';
  }
  if (code) return `erro do servidor (${code.replace(/^firestore\//, '')})`;
  return message ? `erro inesperado (${message.slice(0, 80)})` : 'erro inesperado';
}

/**
 * "Não foi possível adicionar o participante: o servidor recusou por falta de permissão."
 * The action is said first, then the reason; the error also goes to the console.
 */
export function explainError(action: string, error: unknown): string {
  console.error(action, error);
  const lead = action.replace(/\s*Tente (novamente|de novo)\.?\s*$/i, '').replace(/[.\s]+$/, '');
  return `${lead}: ${errorReason(error)}.`;
}
