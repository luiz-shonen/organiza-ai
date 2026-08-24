import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgSelectFieldComponent, OrgSelectOption } from './org-select-field.component';

const OPTIONS: readonly OrgSelectOption[] = [
  { label: 'Presencial', value: 'in-person' },
  { label: 'Online', value: 'online' },
];

describe('OrgSelectFieldComponent', () => {
  it('renders typed options and the selected model value', async () => {
    await TestBed.configureTestingModule({ imports: [OrgSelectFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgSelectFieldComponent> = TestBed.createComponent(OrgSelectFieldComponent);
    fixture.componentRef.setInput('label', 'Formato');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'online');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Formato');
    expect(fixture.componentInstance.value()).toBe('online');
  });

  it('uses a safe empty state and blocks selection while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgSelectFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgSelectFieldComponent> = TestBed.createComponent(OrgSelectFieldComponent);
    fixture.componentRef.setInput('label', 'Formato');
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('error', 'Escolha um formato.');
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
    expect(select.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma opção disponível.');
    expect(fixture.nativeElement.textContent).toContain('Escolha um formato.');
  });
});
