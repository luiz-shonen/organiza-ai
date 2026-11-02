const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;

/** An e-mail address, kept trimmed and in lower case. */
export class Email {
  static readonly MAX = 254;
  static readonly INVALID_MESSAGE = 'Informe um e-mail válido, ex.: nome@email.com';

  private constructor(readonly value: string) {}

  /** The problem with `raw`, or null when it is a valid address. Empty text is left to `required`. */
  static validate(raw: string | null | undefined): string | null {
    const email = (raw ?? '').trim();
    if (email.length === 0) return null;
    if (email.length > Email.MAX || !EMAIL_PATTERN.test(email)) return Email.INVALID_MESSAGE;
    return null;
  }

  static create(raw: string | null | undefined): Email | null {
    const email = (raw ?? '').trim().toLowerCase();
    return email && !Email.validate(email) ? new Email(email) : null;
  }
}
