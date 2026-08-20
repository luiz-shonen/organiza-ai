import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DrawerService } from './drawer.service';

describe('DrawerService', () => {
  let service: DrawerService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DrawerService],
    });
    service = TestBed.inject(DrawerService);
  });

  it('should initialize with closed state and null data', () => {
    expect(service.drawerType()).toBeNull();
    expect(service.isOpen()).toBe(false);
    expect(service.drawerData()).toBeNull();
  });

  it('should open admin drawer and set isOpen signal to true', () => {
    service.openAdminDrawer();

    expect(service.drawerType()).toBe('admin');
    expect(service.isOpen()).toBe(true);
    expect(service.drawerData()).toBeNull();
  });

  it('should open event drawer with optional payload and set isOpen signal to true', () => {
    const payload = { eventId: 'evt-123', title: 'Churrasco' };
    service.openEventDrawer(payload);

    expect(service.drawerType()).toBe('event');
    expect(service.isOpen()).toBe(true);
    expect(service.drawerData()).toEqual(payload);
  });

  it('should close drawer and reset drawerType and drawerData signals', () => {
    service.openEventDrawer({ eventId: 'evt-123' });
    expect(service.isOpen()).toBe(true);

    service.close();

    expect(service.drawerType()).toBeNull();
    expect(service.isOpen()).toBe(false);
    expect(service.drawerData()).toBeNull();
  });
});
