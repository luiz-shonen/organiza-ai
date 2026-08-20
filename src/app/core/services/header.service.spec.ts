import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HeaderService } from './header.service';

describe('HeaderService', () => {
  let service: HeaderService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [HeaderService],
    });
    service = TestBed.inject(HeaderService);
  });

  it('should initialize with default header state', () => {
    expect(service.title()).toBeNull();
    expect(service.showBackBtn()).toBe(false);
    expect(service.backUrl()).toBe('/');
  });

  it('should update title signal reactively', () => {
    service.title.set('Organiza AI - Detalhes');
    expect(service.title()).toBe('Organiza AI - Detalhes');

    service.title.set(null);
    expect(service.title()).toBeNull();
  });

  it('should configure back button visibility and custom back URL', () => {
    service.showBackBtn.set(true);
    service.backUrl.set('/admin');

    expect(service.showBackBtn()).toBe(true);
    expect(service.backUrl()).toBe('/admin');
  });
});
