/**
 * People the organizer already knows from their own events: guests, companions, amigo oculto
 * participants and their family. Offered while typing a name, so the phone comes along.
 */
export interface KnownPerson {
  readonly name: string;
  /** "(11) 98888-1111", or '' when none was ever given. */
  readonly phone: string;
}

/** "Jéssica  Melo" and "jessica melo" are the same person to look up. */
export function personKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * One entry per person, sorted by name. The same name with the same phone is one person; the
 * same name without a phone joins the entry that has one, so the phone is never lost.
 */
export function buildKnownPeople(people: readonly KnownPerson[]): KnownPerson[] {
  const byKey = new Map<string, KnownPerson>();
  const digits = (phone: string) => phone.replace(/\D/g, '');
  for (const person of people) {
    const name = person.name.replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const phone = (person.phone ?? '').trim();
    const nameKey = personKey(name);
    if (!phone) {
      // Kept only when nobody with this name is known yet.
      const known = [...byKey.keys()].some((key) => key.startsWith(`${nameKey}|`));
      if (!known) byKey.set(`${nameKey}|`, { name, phone: '' });
      continue;
    }
    byKey.delete(`${nameKey}|`);
    const key = `${nameKey}|${digits(phone)}`;
    if (!byKey.has(key)) byKey.set(key, { name, phone });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** The people whose name contains what was typed (accents and case aside), at most `limit`. */
export function matchKnownPeople(
  people: readonly KnownPerson[],
  typed: string,
  limit = 6,
): KnownPerson[] {
  const query = personKey(typed);
  if (!query) return [];
  return people.filter((person) => personKey(person.name).includes(query)).slice(0, limit);
}
