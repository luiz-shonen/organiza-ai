import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal, WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services';
import { ThemeMode } from '../../../core/models';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let currentModeSignal: WritableSignal<ThemeMode>;
  let mockThemeService: {
    mode: WritableSignal<ThemeMode>;
    setMode: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    currentModeSignal = signal<ThemeMode>('system');
    mockThemeService = {
      mode: currentModeSignal,
      setMode: vi.fn((mode: ThemeMode) => currentModeSignal.set(mode)),
    };

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the correct icon based on current theme mode', () => {
    currentModeSignal.set('light');
    fixture.detectChanges();
    let mainIcon = fixture.nativeElement.querySelector('button[mat-icon-button] mat-icon');
    expect(mainIcon?.textContent?.trim()).toBe('light_mode');

    currentModeSignal.set('dark');
    fixture.detectChanges();
    mainIcon = fixture.nativeElement.querySelector('button[mat-icon-button] mat-icon');
    expect(mainIcon?.textContent?.trim()).toBe('dark_mode');

    currentModeSignal.set('system');
    fixture.detectChanges();
    mainIcon = fixture.nativeElement.querySelector('button[mat-icon-button] mat-icon');
    expect(mainIcon?.textContent?.trim()).toBe('brightness_auto');
  });

  it('should call themeService.setMode with corresponding mode when setMode is invoked', () => {
    fixture.detectChanges();

    (component as any).setMode('light');
    expect(mockThemeService.setMode).toHaveBeenCalledWith('light');

    (component as any).setMode('dark');
    expect(mockThemeService.setMode).toHaveBeenCalledWith('dark');

    (component as any).setMode('system');
    expect(mockThemeService.setMode).toHaveBeenCalledWith('system');
  });

  it('should include aria-label for accessibility on the toggle button', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[mat-icon-button]');
    expect(btn?.getAttribute('aria-label')).toBe('Alterar tema');
  });
});
