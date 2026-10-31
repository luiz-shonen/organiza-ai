import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrgSkeletonComponent } from './org-skeleton.component';

describe('OrgSkeletonComponent', () => {
  let fixture: ComponentFixture<OrgSkeletonComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgSkeletonComponent);
    fixture.detectChanges();
  });

  it('is hidden from assistive technology', () => {
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches to a circular placeholder', () => {
    fixture.componentRef.setInput('shape', 'circle');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('org-skeleton--circle')).toBe(true);
  });
});
