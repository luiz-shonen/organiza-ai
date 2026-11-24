import type { MapLocationData } from '../models/event.model';
import { normalizePlainText } from './plain-text';

/** Longest text the field takes: a link copied from the address bar can be long. */
export const MAP_LOCATION_INPUT_MAX = 4000;
/** Longest link saved; short share links are about 40 characters. */
export const MAP_LOCATION_URL_MAX = 500;
const LABEL_MAX = 80;

/**
 * Only map sites open from the invite: anything else could send guests to a harmful page.
 * Google Maps (short share links and maps pages, also .com.br) and Waze.
 */
const SAFE_LINK =
  /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.com(\.br)?\/maps[/?]|maps\.google\.com(\.br)?\/|(www\.|ul\.)?waze\.com\/)/i;

const COORDS = /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;
// A link starts the text or follows a space, so "javascript:…//maps.app.goo.gl/" is no link.
const URL_IN_TEXT = /(?:^|\s)((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}\/\S*)/i;

function validPin(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function cleanLabel(raw: string): string | undefined {
  const label = normalizePlainText(raw.replace(/[<>{}]/g, ''))
    .replace(/^[\s:–—-]+|[\s:–—-]+$/g, '')
    .slice(0, LABEL_MAX)
    .trim();
  return label && /[\p{L}\p{N}]/u.test(label) ? label : undefined;
}

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
}

/** The pin a maps link carries: the place itself, else the map's centre, else a query. */
function pinFromUrl(url: URL): { lat: number; lng: number } | null {
  const text = safeDecode(url.pathname + url.search + url.hash);
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match && validPin(Number(match[1]), Number(match[2]))) {
      return { lat: Number(match[1]), lng: Number(match[2]) };
    }
  }
  for (const key of ['q', 'query', 'll', 'destination', 'daddr', 'center']) {
    const value = url.searchParams.get(key);
    const match = value ? new RegExp(`^\\s*${COORDS.source}\\s*$`).exec(value) : null;
    if (match && validPin(Number(match[1]), Number(match[2]))) {
      return { lat: Number(match[1]), lng: Number(match[2]) };
    }
  }
  return null;
}

/** "Sítio Boa Vista" from https://www.google.com/maps/place/S%C3%ADtio+Boa+Vista/@… */
function placeName(url: URL): string | undefined {
  const match = /\/maps\/place\/([^/]+)/.exec(url.pathname);
  if (!match) return undefined;
  const name = safeDecode(match[1]);
  return COORDS.test(name) ? undefined : cleanLabel(name);
}

/**
 * What the organizer pasted to show where the event is: latitude and longitude, a Google Maps
 * link (shared, or copied from the address bar), the location sent on WhatsApp, or a Waze
 * link. A long link is kept as its pin only; a link to any other site is refused.
 */
export class MapLocation {
  static readonly INVALID_MESSAGE =
    'Cole um link do Google Maps ou a latitude e longitude, como -19.9167, -43.9345';
  static readonly UNSAFE_MESSAGE = 'Por segurança, só aceitamos links do Google Maps ou do Waze';
  static readonly LONG_MESSAGE =
    'Link muito longo. No Google Maps, toque em "Compartilhar" e cole o link curto';

  private constructor(readonly data: MapLocationData) {}

  static validate(raw: string | null | undefined): string | null {
    const text = (raw ?? '').trim();
    if (!text) return null;
    if (text.length > MAP_LOCATION_INPUT_MAX) return MapLocation.LONG_MESSAGE;
    const link = URL_IN_TEXT.exec(text);
    if (link) {
      const url = MapLocation.parseUrl(link[1]);
      if (!url || !SAFE_LINK.test(url.href)) return MapLocation.UNSAFE_MESSAGE;
      if (!pinFromUrl(url) && url.href.length > MAP_LOCATION_URL_MAX) {
        return MapLocation.LONG_MESSAGE;
      }
      return null;
    }
    return MapLocation.create(text) ? null : MapLocation.INVALID_MESSAGE;
  }

  static create(raw: string | null | undefined): MapLocation | null {
    const text = (raw ?? '').trim();
    if (!text || text.length > MAP_LOCATION_INPUT_MAX) return null;

    const link = URL_IN_TEXT.exec(text);
    if (link) {
      const url = MapLocation.parseUrl(link[1]);
      if (!url || !SAFE_LINK.test(url.href)) return null;
      // Text around the link, as Google Maps shares it ("Sítio Boa Vista https://…").
      const label = cleanLabel(text.replace(link[1], ' ')) ?? placeName(url);
      const pin = pinFromUrl(url);
      if (pin) return MapLocation.pin(pin.lat, pin.lng, label);
      return url.href.length <= MAP_LOCATION_URL_MAX ? new MapLocation({ url: url.href }) : null;
    }

    const match = COORDS.exec(text);
    if (!match) return null;
    const label = cleanLabel(text.replace(match[0], ' '));
    return MapLocation.pin(Number(match[1]), Number(match[2]), label);
  }

  /** Saved data read back, checked again: only a valid pin or a map site's link opens. */
  static fromData(value: unknown): MapLocation | null {
    if (!value || typeof value !== 'object') return null;
    const data = value as Record<string, unknown>;
    if (typeof data['lat'] === 'number' && typeof data['lng'] === 'number') {
      const label = typeof data['label'] === 'string' ? data['label'] : undefined;
      return MapLocation.pin(data['lat'], data['lng'], label);
    }
    if (typeof data['url'] === 'string') {
      const url = MapLocation.parseUrl(data['url']);
      return url && SAFE_LINK.test(url.href) && url.href.length <= MAP_LOCATION_URL_MAX
        ? new MapLocation({ url: url.href })
        : null;
    }
    return null;
  }

  private static pin(lat: number, lng: number, label?: string): MapLocation | null {
    if (!validPin(lat, lng)) return null;
    const clean = label ? cleanLabel(label) : undefined;
    return new MapLocation({
      lat: round(lat),
      lng: round(lng),
      ...(clean ? { label: clean } : {}),
    });
  }

  /** https only, no user, password or port: a plain address of the map site. */
  private static parseUrl(raw: string): URL | null {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (url.protocol === 'http:') url.protocol = 'https:';
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      return url;
    } catch {
      return null;
    }
  }

  /** The address that opens the place: the pin on Google Maps, or the link itself. */
  get href(): string {
    return 'url' in this.data
      ? this.data.url
      : `https://www.google.com/maps/search/?api=1&query=${this.data.lat},${this.data.lng}`;
  }

  /** Back in the editor's field: "Sítio Boa Vista: -19.9167, -43.9345" or the link. */
  get text(): string {
    if ('url' in this.data) return this.data.url;
    const pin = `${this.data.lat}, ${this.data.lng}`;
    return this.data.label ? `${this.data.label}: ${pin}` : pin;
  }

  /** What the editor shows under the field once it is understood. */
  get summary(): string {
    if ('url' in this.data) return 'Link do mapa reconhecido. Os convidados abrem este local.';
    const place = this.data.label ? `${this.data.label} · ` : '';
    return `Local marcado: ${place}${this.data.lat}, ${this.data.lng}`;
  }
}
