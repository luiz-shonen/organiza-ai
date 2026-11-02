import type { AddressDetails } from '../models/event.model';

/**
 * Splits the one-line location the editor saves ("Rua X, 12 - Bairro - Cidade/UF -
 * CEP: 00000-000") back into its fields, for events saved before `addressDetails`
 * existed. Parts that are missing stay empty for the organizer to fill in.
 */
export function parseLocation(location: string | null | undefined): Required<AddressDetails> {
  const parts = (location ?? '')
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean);
  const cepIndex = parts.findIndex((part) => /^CEP:/i.test(part));
  const cep = cepIndex >= 0 ? parts.splice(cepIndex, 1)[0].replace(/^CEP:\s*/i, '') : '';
  const [street = '', neighborhood = '', city = ''] = parts;
  const match = /^(.*),\s*([^,]+)$/.exec(street);
  return {
    address: match ? match[1].trim() : street,
    number: match ? match[2].trim() : '',
    neighborhood,
    city,
    cep,
  };
}
