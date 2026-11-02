import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgAvatarComponent } from './org-avatar.component';

describe('OrgAvatarComponent', () => {
  it('shows the uppercase initial when there is no photo', async () => {
    await TestBed.configureTestingModule({ imports: [OrgAvatarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgAvatarComponent);
    fixture.componentRef.setInput('name', ' jéssica Rodrigues');
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('.org-avatar') as HTMLElement;
    expect(avatar.textContent?.trim()).toBe('J');
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the photo and the large size', async () => {
    await TestBed.configureTestingModule({ imports: [OrgAvatarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgAvatarComponent);
    fixture.componentRef.setInput('photoUrl', 'https://example.com/me.png');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img')?.getAttribute('src')).toBe('https://example.com/me.png');
    expect(element.querySelector('.org-avatar--lg')).toBeTruthy();
  });
});
