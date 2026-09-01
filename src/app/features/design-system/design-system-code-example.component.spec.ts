import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { DesignSystemCodeExampleComponent } from './design-system-code-example.component';

describe('DesignSystemCodeExampleComponent', () => {
  it('keeps the code collapsed until the person explicitly expands it', async () => {
    await TestBed.configureTestingModule({
      imports: [DesignSystemCodeExampleComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture: ComponentFixture<DesignSystemCodeExampleComponent> = TestBed.createComponent(
      DesignSystemCodeExampleComponent,
    );
    fixture.componentRef.setInput('code', '<org-page-layout />');
    fixture.detectChanges();

    const disclosure = (fixture.nativeElement as HTMLElement).querySelector<HTMLDetailsElement>(
      'details',
    );
    const summary = disclosure?.querySelector<HTMLElement>('summary');

    expect(disclosure?.open).toBe(false);

    summary?.click();
    fixture.detectChanges();

    expect(disclosure?.open).toBe(true);
  });

  it('renders and copies the documented Angular example', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await TestBed.configureTestingModule({
      imports: [DesignSystemCodeExampleComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture: ComponentFixture<DesignSystemCodeExampleComponent> = TestBed.createComponent(
      DesignSystemCodeExampleComponent,
    );
    fixture.componentRef.setInput('code', '<org-page-layout />');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button',
    );
    button?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('<org-page-layout />');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Copiado');
  });
});
