import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkPreviewSheetComponent } from './link-preview-sheet.component';
import { LinkPreviewService } from '../../../core/services';
import type { LinkPreview } from '../../../core/models';

describe('LinkPreviewSheetComponent', () => {
  let fixture: ComponentFixture<LinkPreviewSheetComponent>;
  let service: LinkPreviewService;
  const el = () => document.body;
  const byTestId = (id: string) => el().querySelector(`[data-testid="${id}"]`);
  const press = (id: string) =>
    (
      el().querySelector(
        `[data-testid="${id}"] button, button[data-testid="${id}"]`,
      ) as HTMLButtonElement
    ).click();

  const preview: LinkPreview = {
    url: 'https://bit.ly/chaves',
    finalUrl: 'https://pt.aliexpress.com/item/1.html',
    host: 'pt.aliexpress.com',
    title: 'Conjunto de Chaves de Fenda 50 em 1',
    description: '',
    image: '',
    siteName: 'AliExpress',
    price: 'R$ 89,90',
    dangerous: false,
    unreadable: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkPreviewSheetComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LinkPreviewSheetComponent);
    document.body.appendChild(fixture.nativeElement);
    service = TestBed.inject(LinkPreviewService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    vi.restoreAllMocks();
  });

  it('shows what a short link really leads to, with the price, and opens the real address', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    service.state.set({ url: preview.url, preview, loading: false });
    fixture.detectChanges();

    expect(byTestId('link-preview-card')?.textContent).toContain('Conjunto de Chaves');
    expect(byTestId('link-preview-price')?.textContent).toContain('R$ 89,90');
    expect(byTestId('link-preview-host')?.textContent).toContain('AliExpress · pt.aliexpress.com');
    expect(el().textContent).toContain('Este link leva para pt.aliexpress.com');
    expect(byTestId('link-preview-danger')).toBeNull();
    expect(byTestId('link-preview-stop')).toBeNull();
    expect(byTestId('link-preview-unchecked')).toBeNull();

    press('link-preview-open');
    expect(open).toHaveBeenCalledWith(preview.finalUrl, '_blank', 'noopener,noreferrer');
    expect(service.state()).toBeNull();
  });

  it('warns when Google lists the site as dangerous', () => {
    service.state.set({
      url: preview.url,
      preview: { ...preview, dangerous: true },
      loading: false,
    });
    fixture.detectChanges();
    expect(byTestId('link-preview-danger')?.textContent).toContain('perigoso');
    expect(byTestId('link-preview-stop')).not.toBeNull();
    expect(el().textContent).toContain('Pare! Link perigoso');
    expect(byTestId('link-preview-open')?.textContent).toContain('Abrir mesmo assim');
  });

  it('without a preview, still names the site and says it could not be checked', () => {
    service.state.set({ url: 'https://bit.ly/x', preview: null, loading: false });
    fixture.detectChanges();
    expect(el().textContent).toContain('bit.ly');
    expect(el().textContent).toContain('link encurtado');
    expect(byTestId('link-preview-unchecked')).not.toBeNull();
  });

  it('says it is checking while the preview loads, and Voltar closes it', () => {
    service.state.set({ url: preview.url, preview: null, loading: true });
    fixture.detectChanges();
    expect(byTestId('link-preview-loading')?.textContent).toContain('Verificando o link');
    press('link-preview-cancel');
    fixture.detectChanges();
    expect(byTestId('link-preview-sheet')).toBeNull();
  });
});
