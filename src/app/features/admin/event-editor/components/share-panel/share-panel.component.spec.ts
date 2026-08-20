import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import QRCode from 'qrcode';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SharePanelComponent } from './share-panel.component';

describe('SharePanelComponent', () => {
  let fixture: ComponentFixture<SharePanelComponent>;
  let component: SharePanelComponent;
  let componentRef: ComponentRef<SharePanelComponent>;

  let mockClipboard: {
    copy: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let qrToCanvasSpy: ReturnType<typeof vi.spyOn>;
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    mockClipboard = {
      copy: vi.fn(),
    };
    mockSnackBar = {
      open: vi.fn(),
    };

    qrToCanvasSpy = vi
      .spyOn(QRCode, 'toCanvas')
      .mockImplementation((() => Promise.resolve({})) as any);
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await TestBed.configureTestingModule({
      imports: [SharePanelComponent],
      providers: [
        { provide: Clipboard, useValue: mockClipboard },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SharePanelComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create component and not render card when eventUrl is empty', () => {
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.share-panel');
    expect(card).toBeNull();
  });

  it('should render card and call QRCode.toCanvas when eventUrl is provided', async () => {
    componentRef.setInput('eventUrl', 'https://organiza.ai/events/evt-123');
    componentRef.setInput('eventTitle', 'Aniversário do Luiz');
    fixture.detectChanges();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('.share-panel');
    expect(card).toBeTruthy();

    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();

    expect(qrToCanvasSpy).toHaveBeenCalledWith(
      canvas,
      'https://organiza.ai/events/evt-123',
      expect.objectContaining({
        width: 200,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      }),
    );
  });

  it('should copy event url to clipboard and show snackbar notification', () => {
    componentRef.setInput('eventUrl', 'https://organiza.ai/events/evt-123');
    fixture.detectChanges();

    (component as any).copyLink();

    expect(mockClipboard.copy).toHaveBeenCalledWith('https://organiza.ai/events/evt-123');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Link copiado!', 'OK', { duration: 2000 });
  });

  it('should open WhatsApp with formatted text containing event title and URL', () => {
    componentRef.setInput('eventUrl', 'https://organiza.ai/events/evt-123');
    componentRef.setInput('eventTitle', 'Churrasco da Turma');
    fixture.detectChanges();

    (component as any).shareWhatsApp();

    const expectedText = `🎉 Você está convidado(a) para *Churrasco da Turma*!\n\nConfirme sua presença e veja o que levar:\nhttps://organiza.ai/events/evt-123`;
    const expectedUrl = `https://wa.me/?text=${encodeURIComponent(expectedText)}`;

    expect(windowOpenSpy).toHaveBeenCalledWith(expectedUrl, '_blank');
  });

  it('should use default event title in WhatsApp message when eventTitle is empty', () => {
    componentRef.setInput('eventUrl', 'https://organiza.ai/events/evt-123');
    componentRef.setInput('eventTitle', '');
    fixture.detectChanges();

    (component as any).shareWhatsApp();

    const expectedText = `🎉 Você está convidado(a) para *nosso evento*!\n\nConfirme sua presença e veja o que levar:\nhttps://organiza.ai/events/evt-123`;
    const expectedUrl = `https://wa.me/?text=${encodeURIComponent(expectedText)}`;

    expect(windowOpenSpy).toHaveBeenCalledWith(expectedUrl, '_blank');
  });
});
