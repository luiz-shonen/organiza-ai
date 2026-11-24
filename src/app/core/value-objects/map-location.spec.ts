import { describe, expect, it } from 'vitest';
import { MapLocation } from './map-location';

describe('MapLocation', () => {
  it('reads latitude and longitude, with or without a place name', () => {
    expect(MapLocation.create('-19.9167, -43.9345')?.data).toEqual({
      lat: -19.9167,
      lng: -43.9345,
    });
    expect(MapLocation.create('Sítio Boa Vista: -19.9167,-43.9345')?.data).toEqual({
      lat: -19.9167,
      lng: -43.9345,
      label: 'Sítio Boa Vista',
    });
  });

  it('keeps a short share link as it is, and the name Google Maps shares with it', () => {
    expect(MapLocation.create('https://maps.app.goo.gl/AbC123xyz')?.data).toEqual({
      url: 'https://maps.app.goo.gl/AbC123xyz',
    });
    expect(MapLocation.create('maps.app.goo.gl/AbC123xyz')?.href).toBe(
      'https://maps.app.goo.gl/AbC123xyz',
    );
  });

  it('keeps only the pin and the place name of a long link copied from the address bar', () => {
    const long =
      'https://www.google.com/maps/place/S%C3%ADtio+Boa+Vista/@-19.3,-43.7,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-19.312345!4d-43.712345!16s%2Fg%2F11abc' +
      '!'.repeat(1500);
    const pin = MapLocation.create(long);
    expect(pin?.data).toEqual({ lat: -19.312345, lng: -43.712345, label: 'Sítio Boa Vista' });
    expect(pin?.text).toBe('Sítio Boa Vista: -19.312345, -43.712345');
    expect(MapLocation.validate(long)).toBeNull();
  });

  it('reads the location sent on WhatsApp and Waze links', () => {
    expect(MapLocation.create('https://maps.google.com/?q=-19.91,-43.93')?.data).toEqual({
      lat: -19.91,
      lng: -43.93,
    });
    expect(MapLocation.create('https://waze.com/ul?ll=-19.91%2C-43.93&navigate=yes')?.data).toEqual(
      { lat: -19.91, lng: -43.93 },
    );
  });

  it('opens a pin on Google Maps', () => {
    expect(MapLocation.create('-19.9167, -43.9345')?.href).toBe(
      'https://www.google.com/maps/search/?api=1&query=-19.9167,-43.9345',
    );
  });

  it('refuses links to other sites, look-alike hosts and other schemes', () => {
    for (const unsafe of [
      'https://evil.example.com/maps',
      'https://maps.app.goo.gl.evil.com/x',
      'https://google.com.evil.io/maps/x',
      'https://user:pass@maps.app.goo.gl/x',
      'https://maps.app.goo.gl:8443/x',
      'javascript:alert(1)//maps.app.goo.gl/',
      'https://www.google.com/url?q=https://evil.com',
    ]) {
      expect(MapLocation.create(unsafe), unsafe).toBeNull();
      expect(MapLocation.validate(unsafe), unsafe).not.toBeNull();
    }
    expect(MapLocation.validate('https://evil.example.com/maps')).toBe(MapLocation.UNSAFE_MESSAGE);
  });

  it('refuses coordinates out of range and text that is not a place', () => {
    expect(MapLocation.create('-95, 20')).toBeNull();
    expect(MapLocation.create('0, 0')).toBeNull();
    expect(MapLocation.validate('perto da igreja')).toBe(MapLocation.INVALID_MESSAGE);
    expect(MapLocation.validate('')).toBeNull();
  });

  it('asks for the short link when a long one carries no pin', () => {
    const long = `https://www.google.com/maps/search/${'sitio+'.repeat(120)}`;
    expect(MapLocation.validate(long)).toBe(MapLocation.LONG_MESSAGE);
  });

  it('checks saved data again before it opens', () => {
    expect(MapLocation.fromData({ url: 'https://evil.com/x' })).toBeNull();
    expect(MapLocation.fromData({ lat: 200, lng: 0 })).toBeNull();
    expect(MapLocation.fromData({ lat: -19.9, lng: -43.9, label: 'Sítio' })?.text).toBe(
      'Sítio: -19.9, -43.9',
    );
    expect(MapLocation.fromData(null)).toBeNull();
  });
});
