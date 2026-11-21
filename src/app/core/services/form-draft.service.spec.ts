import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FormDraftService } from './form-draft.service';

describe('FormDraftService', () => {
  const day = 24 * 60 * 60 * 1000;
  let drafts: FormDraftService;

  beforeEach(() => {
    localStorage.clear();
    drafts = new FormDraftService();
  });

  afterEach(() => vi.restoreAllMocks());

  it('keeps a draft and gives it back with when it was saved', () => {
    drafts.save('event:u1:novo', { title: 'Natal' }, 1_000);
    expect(drafts.load('event:u1:novo', 2_000)).toEqual({
      value: { title: 'Natal' },
      savedAt: 1_000,
    });
    drafts.clear('event:u1:novo');
    expect(drafts.load('event:u1:novo')).toBeNull();
  });

  it('forgets a draft older than three days', () => {
    drafts.save('event:u1:novo', { title: 'Natal' }, 0);
    expect(drafts.load('event:u1:novo', 3 * day)).not.toBeNull();
    expect(drafts.load('event:u1:novo', 3 * day + 1)).toBeNull();
    expect(localStorage.getItem(`${FormDraftService.PREFIX}event:u1:novo`)).toBeNull();
  });

  it('drops old drafts on start, and leaves other storage alone', () => {
    localStorage.setItem('theme_mode', 'dark');
    drafts.save('old', 1, Date.now() - 4 * day);
    drafts.save('new', 2);
    new FormDraftService();
    expect(localStorage.getItem(`${FormDraftService.PREFIX}old`)).toBeNull();
    expect(drafts.load('new')?.value).toBe(2);
    expect(localStorage.getItem('theme_mode')).toBe('dark');
  });

  it('treats an unreadable draft as none', () => {
    localStorage.setItem(`${FormDraftService.PREFIX}broken`, '{not json');
    expect(drafts.load('broken')).toBeNull();
  });

  it('keeps working without storage (private mode, full)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => drafts.save('event:u1:novo', { title: 'Natal' })).not.toThrow();
    expect(drafts.load('event:u1:novo')).toBeNull();
  });
});
