const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/**
 * People in alphabetical order, as a Brazilian reads it: accents and capitals do not change the
 * order ("Álvaro" next to "Alice", "ana" with "Ana"). A copy; the list given is left as it was.
 */
export function sortByName<T extends { readonly name: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => collator.compare(a.name.trim(), b.name.trim()));
}
