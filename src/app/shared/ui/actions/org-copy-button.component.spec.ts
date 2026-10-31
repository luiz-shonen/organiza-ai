import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clipboard } from '@angular/cdk/clipboard';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackService } from '../feedback/feedback.service';
import { OrgCopyButtonComponent } from './org-copy-button.component';

describe('OrgCopyButtonComponent', () => {
  let fixture: ComponentFixture<OrgCopyButtonComponent>;
  const clipboard = { copy: vi.fn().mockReturnValue(true) };
  const feedback = { success: vi.fn() };

  beforeEach(() => {
    clipboard.copy.mockClear();
    feedback.success.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Clipboard, useValue: clipboard },
        { provide: FeedbackService, useValue: feedback },
      ],
    });
    fixture = TestBed.createComponent(OrgCopyButtonComponent);
    fixture.componentRef.setInput('value', 'minha-chave-pix-123');
    fixture.componentRef.setInput('copiedMessage', 'Chave Pix copiada!');
    fixture.detectChanges();
  });

  it('copies the value, confirms with a toast and emits it', () => {
    const copied = vi.fn();
    fixture.componentInstance.copied.subscribe(copied);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(clipboard.copy).toHaveBeenCalledWith('minha-chave-pix-123');
    expect(feedback.success).toHaveBeenCalledWith('Chave Pix copiada!', { duration: 2000 });
    expect(copied).toHaveBeenCalledWith('minha-chave-pix-123');
  });

  it('is disabled when there is nothing to copy', () => {
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
