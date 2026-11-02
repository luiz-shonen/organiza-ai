import { normalizePlainText, validatePlainText, type PlainTextRules } from './plain-text';

function createText(raw: string | null | undefined, rules: PlainTextRules): string | null {
  const text = normalizePlainText(raw, rules.multiline);
  return text && !validatePlainText(text, rules) ? text : null;
}

/** An event title: 3 to 80 characters on one line. */
export class EventTitle {
  static readonly RULES: PlainTextRules = { min: 3, max: 80 };

  private constructor(readonly value: string) {}

  static validate(raw: string | null | undefined): string | null {
    return validatePlainText(raw, EventTitle.RULES);
  }

  /** The normalized title, or null when `raw` is empty or breaks the rules. */
  static create(raw: string | null | undefined): EventTitle | null {
    const text = createText(raw, EventTitle.RULES);
    return text ? new EventTitle(text) : null;
  }
}

/** An event description: 5 to 500 characters, line breaks kept. */
export class EventDescription {
  static readonly RULES: PlainTextRules = { min: 5, max: 500, multiline: true };

  private constructor(readonly value: string) {}

  static validate(raw: string | null | undefined): string | null {
    return validatePlainText(raw, EventDescription.RULES);
  }

  static create(raw: string | null | undefined): EventDescription | null {
    const text = createText(raw, EventDescription.RULES);
    return text ? new EventDescription(text) : null;
  }
}

/** The name of something to bring: 2 to 60 characters on one line. */
export class ItemName {
  static readonly RULES: PlainTextRules = { min: 2, max: 60 };

  private constructor(readonly value: string) {}

  static validate(raw: string | null | undefined): string | null {
    return validatePlainText(raw, ItemName.RULES);
  }

  static create(raw: string | null | undefined): ItemName | null {
    const text = createText(raw, ItemName.RULES);
    return text ? new ItemName(text) : null;
  }
}
