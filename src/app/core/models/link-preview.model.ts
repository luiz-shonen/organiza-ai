/** What a link in a gift idea leads to, as the preview relay read it (`POST /preview`). */
export interface LinkPreview {
  readonly url: string;
  /** Where it really leads, after redirects. */
  readonly finalUrl: string;
  readonly host: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly siteName: string;
  readonly price: string;
  /** true: Google Safe Browsing lists it as dangerous; false: not listed; null: not checked. */
  readonly dangerous: boolean | null;
  /** The page could not be read (the store blocks it, offline): only the address is known. */
  readonly unreadable: boolean;
}
