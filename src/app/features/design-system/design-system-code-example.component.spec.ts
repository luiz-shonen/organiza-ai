import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clipboard } from '@angular/cdk/clipboard';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackService } from '../../shared/ui';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

describe('DesignSystemCodeExampleComponent', () => {
  async function render(): Promise<{
    fixture: ComponentFixture<DesignSystemCodeExampleComponent>;
    copy: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  }> {
    const copy = vi.fn().mockReturnValue(true);
    const success = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DesignSystemCodeExampleComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Clipboard, useValue: { copy } },
        { provide: FeedbackService, useValue: { success, error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DesignSystemCodeExampleComponent);
    fixture.componentRef.setInput('code', '<org-page-layout />');
    fixture.detectChanges();
    return { fixture, copy, success };
  }

  it('shows the snippet under its label, without hiding it', async () => {
    const { fixture } = await render();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ds-code__label')?.textContent).toContain('Uso recomendado');
    expect(root.querySelector('pre code')?.textContent).toBe('<org-page-layout />');
  });

  it('copies the snippet through the shared copy button', async () => {
    const { fixture, copy, success } = await render();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();

    expect(copy).toHaveBeenCalledWith('<org-page-layout />');
    expect(success).toHaveBeenCalledWith('Código copiado!', { duration: 2000 });
  });
});
