import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RsvpDrawerResult } from '../models';
import { DrawerService } from './drawer.service';

describe('DrawerService', () => {
  let service: DrawerService;

  beforeEach(() => {
    service = new DrawerService();
  });

  it('starts closed without an active drawer request', () => {
    expect(service.request()).toBeNull();
    expect(service.drawerType()).toBeNull();
    expect(service.isOpen()).toBe(false);
  });

  it('opens a discriminated navigation request without an untyped payload', () => {
    service.open({ kind: 'navigation' });

    expect(service.request()).toEqual({ kind: 'navigation' });
    expect(service.drawerType()).toBe('navigation');
    expect(service.isOpen()).toBe(true);
  });

  it('delivers a typed RSVP result to its requesting container before closing', () => {
    const onComplete = vi.fn();
    const result: RsvpDrawerResult = {
      name: 'Mariana',
      phone: '11999998888',
      companions: [{ name: 'Bia' }],
      selectedFamilyMembers: [],
    };

    service.open({
      kind: 'rsvp',
      data: { session: null, familyMembers: [], userId: 'user-1' },
      onComplete,
    });
    service.completeRsvp(result);

    expect(onComplete).toHaveBeenCalledWith(result);
    expect(service.request()).toBeNull();
  });

  it('forwards collaborator actions without closing the active workflow', () => {
    const onAction = vi.fn();
    service.open({
      kind: 'collaborator',
      data: { collaborators: [], pendingInvites: [] },
      onAction,
    });

    service.dispatchCollaboratorAction({ action: 'invite', email: 'ana@exemplo.com' });

    expect(onAction).toHaveBeenCalledWith({ action: 'invite', email: 'ana@exemplo.com' });
    expect(service.drawerType()).toBe('collaborator');
  });

  it('clears the request and restores focus to the drawer trigger when closed', async () => {
    const focus = vi.fn();
    const trigger = { focus } as unknown as HTMLElement;
    service.open({ kind: 'navigation', trigger });

    service.close();
    await Promise.resolve();

    expect(service.request()).toBeNull();
    expect(focus).toHaveBeenCalledOnce();
  });
});
