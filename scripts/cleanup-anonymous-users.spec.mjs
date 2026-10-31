import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAnonymousUser,
  filterAnonymousUsers,
  PROTECTED_EMAILS,
} from './cleanup-anonymous-users.mjs';

test('cleanup-anonymous-users: PROTECTED_EMAILS contains essential admin and test accounts', () => {
  assert.ok(PROTECTED_EMAILS.has('luiz.gmr.dev@gmail.com'));
  assert.ok(PROTECTED_EMAILS.has('jessica.calm.dev@gmail.com'));
  assert.ok(PROTECTED_EMAILS.has('admin@organiza-ai.com'));
});

test('cleanup-anonymous-users: isAnonymousUser returns false for protected accounts', () => {
  const protectedUser = {
    localId: 'admin-1',
    email: 'luiz.gmr.dev@gmail.com',
  };
  assert.equal(isAnonymousUser(protectedUser), false);

  const upperCaseProtected = {
    localId: 'admin-2',
    email: 'JESSICA.CALM.DEV@GMAIL.COM',
  };
  assert.equal(isAnonymousUser(upperCaseProtected), false);
});

test('cleanup-anonymous-users: isAnonymousUser returns false for accounts with email, phone or providers', () => {
  const emailUser = {
    localId: 'user-email',
    email: 'guest@example.com',
  };
  assert.equal(isAnonymousUser(emailUser), false);

  const phoneUser = {
    localId: 'user-phone',
    phoneNumber: '+5511999999999',
  };
  assert.equal(isAnonymousUser(phoneUser), false);

  const oauthUser = {
    localId: 'user-oauth',
    providerUserInfo: [{ providerId: 'google.com', rawId: '12345' }],
  };
  assert.equal(isAnonymousUser(oauthUser), false);
});

test('cleanup-anonymous-users: isAnonymousUser returns true for orphan anonymous accounts', () => {
  const anonUser1 = {
    localId: 'anon-1',
  };
  assert.equal(isAnonymousUser(anonUser1), true);

  const anonUser2 = {
    localId: 'anon-2',
    email: '',
    phoneNumber: '',
    providerUserInfo: [],
  };
  assert.equal(isAnonymousUser(anonUser2), true);

  const anonUser3 = {
    localId: 'anon-3',
    email: '   ',
    providerUserInfo: [],
  };
  assert.equal(isAnonymousUser(anonUser3), true);
});

test('cleanup-anonymous-users: filterAnonymousUsers extracts only anonymous accounts from user list', () => {
  const accounts = [
    { localId: '1', email: 'luiz.gmr.dev@gmail.com' },
    { localId: '2', email: 'valid@example.com', providerUserInfo: [{ providerId: 'password' }] },
    { localId: '3' },
    { localId: '4', phoneNumber: '+5511988887777' },
    { localId: '5', providerUserInfo: [] },
  ];

  const anonymous = filterAnonymousUsers(accounts);
  assert.equal(anonymous.length, 2);
  assert.deepEqual(
    anonymous.map((u) => u.localId),
    ['3', '5'],
  );
});
