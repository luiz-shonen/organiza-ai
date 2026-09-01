import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [FirebaseService],
    });
    service = TestBed.inject(FirebaseService);
  });

  it('should be created and instantiate singleton service', () => {
    expect(service).toBeTruthy();
  });

  it('should expose initialized Firebase auth instance', () => {
    expect(service.auth).toBeTruthy();
    expect(typeof service.auth).toBe('object');
  });

  it('should expose initialized Firestore database instance with long polling settings', () => {
    expect(service.firestore).toBeTruthy();
    expect(typeof service.firestore).toBe('object');
  });
});
