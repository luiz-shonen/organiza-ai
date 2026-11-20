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
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Jéssica Melo" says more than "Jéssica": more words, then more letters. */
function fullerName(a: string, b: string): string {
  const words = (name: string) => name.split(' ').length;
  if (words(a) !== words(b)) return words(a) > words(b) ? a : b;
  return b.length > a.length ? b : a;
}

/**
 * One entry per person, sorted by name. The phone is a contact, not who someone is, but one
 * number is one person here: "Jéssica" and "Jéssica Melo" with the same phone become
 * "Jéssica Melo". The same name with another phone stays apart, with its number shown. A name
 * without a phone joins someone of that name who has one, so no phone is lost.
 */
export function buildKnownPeople(people: readonly KnownPerson[]): KnownPerson[] {
  const byPhone = new Map<string, KnownPerson>();
  const withoutPhone = new Map<string, KnownPerson>();
  const digits = (phone: string) => phone.replace(/\D/g, '');
  for (const person of people) {
    const name = person.name.replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const phone = (person.phone ?? '').trim();
    if (!digits(phone)) {
      if (!withoutPhone.has(personKey(name)))
        withoutPhone.set(personKey(name), { name, phone: '' });
      continue;
    }
    const known = byPhone.get(digits(phone));
    byPhone.set(
      digits(phone),
      known ? { name: fullerName(known.name, name), phone } : { name, phone },
    );
  }
  // Someone listed without a phone, already known with one, is that person.
  const phoned = [...byPhone.values()];
  const named = (key: string) =>
    phoned.some((person) => {
      const known = personKey(person.name);
      return known === key || known.startsWith(`${key} `);
    });
  const rest = [...withoutPhone.entries()].filter(([key]) => !named(key)).map(([, p]) => p);
  return [...phoned, ...rest].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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
