import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  getDay,
  getMonth,
  formatTime,
  buildWhatsAppShareUrl,
  shareWhatsApp,
  copyToClipboard,
  generateId,
  generateNotificationId,
  cleanCep,
  formatCep,
  isValidCep,
  RELATIONSHIP_OPTIONS,
  getRelationshipLabel,
} from './index';
import type { FamilyRelationship } from '../models/family.model';

describe('Core Utilities', () => {
  describe('date.utils', () => {
    const sampleIso = '2026-10-15T18:30:00.000Z';

    it('formatDate formats valid ISO dates using default locale and options', () => {
      const formatted = formatDate(sampleIso, 'pt-BR');
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2026');
    });

    it('formatDate formats dates with custom options', () => {
      const formatted = formatDate(sampleIso, 'pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('2026');
    });

    it('formatDate returns empty string for empty or invalid date string', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate('invalid-date-string')).toBe('');
    });

    it('getDay returns 2-digit padded day of the month', () => {
      const d1 = getDay('2026-05-04T12:00:00.000Z');
      expect(d1).toMatch(/^\d{2}$/);
      expect(getDay('')).toBe('');
      expect(getDay('invalid')).toBe('');
    });

    it('getMonth returns uppercase 3-letter month abbreviation without trailing period', () => {
      const month = getMonth(sampleIso, 'pt-BR');
      expect(month).toBeTruthy();
      expect(month).toBe(month.toUpperCase());
      expect(month.includes('.')).toBe(false);
      expect(getMonth('')).toBe('');
      expect(getMonth('not-a-date')).toBe('');
    });

    it('formatTime extracts HH:mm time representation', () => {
      const time = formatTime(sampleIso, 'pt-BR');
      expect(time).toMatch(/^\d{2}:\d{2}$/);
      expect(formatTime('')).toBe('');
      expect(formatTime('invalid')).toBe('');
    });
  });

  describe('sharing.utils', () => {
    it('buildWhatsAppShareUrl constructs formatted WhatsApp URL with all metadata', () => {
      const url = buildWhatsAppShareUrl(
        'Aniversário de 30 Anos',
        '15/10/2026',
        'Espaço das Américas',
        'https://organiza.ai/evento/evt-123'
      );
      expect(url).toContain('https://wa.me/?text=');
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('🎉 Você está convidado(a) para *Aniversário de 30 Anos*!');
      expect(decoded).toContain('📅 15/10/2026');
      expect(decoded).toContain('📍 Espaço das Américas');
      expect(decoded).toContain('https://organiza.ai/evento/evt-123');
    });

    it('buildWhatsAppShareUrl constructs URL with minimal parameters', () => {
      const url = buildWhatsAppShareUrl('Festa');
      expect(url).toContain('https://wa.me/?text=');
      const decoded = decodeURIComponent(url);
      expect(decoded).toBe('https://wa.me/?text=🎉 Você está convidado(a) para *Festa*!');
    });

    it('shareWhatsApp opens the built URL in a new window', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      shareWhatsApp('Churrasco', '20/11/2026', 'Clube', 'https://organiza.ai/evento/abc');
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank'
      );
      openSpy.mockRestore();
    });

    describe('copyToClipboard', () => {
      let originalClipboard: Clipboard;

      beforeEach(() => {
        originalClipboard = navigator.clipboard;
      });

      afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true,
          writable: true,
        });
      });

      it('uses navigator.clipboard.writeText when available and resolves', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: writeTextMock },
          configurable: true,
          writable: true,
        });

        const result = await copyToClipboard('https://organiza.ai/evento/123');
        expect(result).toBe(true);
        expect(writeTextMock).toHaveBeenCalledWith('https://organiza.ai/evento/123');
      });

      it('falls back to execCommand when navigator.clipboard.writeText throws', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
          },
          configurable: true,
          writable: true,
        });

        const execCommandMock = vi.fn().mockReturnValue(true);
        Object.defineProperty(document, 'execCommand', {
          value: execCommandMock,
          configurable: true,
          writable: true,
        });

        const result = await copyToClipboard('test-fallback');
        expect(result).toBe(true);
        expect(execCommandMock).toHaveBeenCalledWith('copy');
      });

      it('returns false when both clipboard API and execCommand fail', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
          },
          configurable: true,
          writable: true,
        });

        Object.defineProperty(document, 'execCommand', {
          value: vi.fn().mockImplementation(() => {
            throw new Error('execCommand unsupported');
          }),
          configurable: true,
          writable: true,
        });

        const result = await copyToClipboard('test-fail');
        expect(result).toBe(false);
      });
    });
  });

  describe('id.utils', () => {
    it('generateId produces a unique non-empty string', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('generateId prefixes the identifier when prefix is supplied', () => {
      const id = generateId('guest');
      expect(id.startsWith('guest_')).toBe(true);
    });

    it('generateNotificationId produces formatted notification id', () => {
      const notifId = generateNotificationId();
      expect(notifId).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });
  });

  describe('cep.utils', () => {
    it('cleanCep strips all non-digit characters', () => {
      expect(cleanCep('01001-000')).toBe('01001000');
      expect(cleanCep('01.001-000')).toBe('01001000');
      expect(cleanCep('abc 123 def 45678')).toBe('12345678');
      expect(cleanCep('')).toBe('');
    });

    it('formatCep formats raw digits into 00000-000 mask', () => {
      expect(formatCep('01001000')).toBe('01001-000');
      expect(formatCep('01001-000')).toBe('01001-000');
      expect(formatCep('12345')).toBe('12345');
      expect(formatCep('1234')).toBe('1234');
      expect(formatCep('')).toBe('');
    });

    it('isValidCep validates 8-digit CEP format', () => {
      expect(isValidCep('01001-000')).toBe(true);
      expect(isValidCep('01001000')).toBe(true);
      expect(isValidCep('1234567')).toBe(false);
      expect(isValidCep('123456789')).toBe(false);
      expect(isValidCep('')).toBe(false);
    });
  });

  describe('relationship.utils', () => {
    it('RELATIONSHIP_OPTIONS contains all 6 family relationship options', () => {
      expect(RELATIONSHIP_OPTIONS).toHaveLength(6);
      const values = RELATIONSHIP_OPTIONS.map((opt) => opt.value);
      expect(values).toEqual(['spouse', 'child', 'parent', 'sibling', 'relative', 'other']);
    });

    it('getRelationshipLabel maps values to Portuguese localized labels', () => {
      expect(getRelationshipLabel('spouse')).toBe('Cônjuge');
      expect(getRelationshipLabel('child')).toBe('Filho(a)');
      expect(getRelationshipLabel('parent')).toBe('Pai/Mãe');
      expect(getRelationshipLabel('sibling')).toBe('Irmão(ã)');
      expect(getRelationshipLabel('relative')).toBe('Parente');
      expect(getRelationshipLabel('other')).toBe('Outro');
    });

    it('getRelationshipLabel returns the raw string if value is not in options', () => {
      expect(getRelationshipLabel('custom' as FamilyRelationship)).toBe('custom');
    });
  });
});
