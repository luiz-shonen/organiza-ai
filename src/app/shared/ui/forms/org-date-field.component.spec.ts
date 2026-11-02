import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgDateAdapter, maskDate } from './org-date-adapter';
import { OrgDateFieldComponent } from './org-date-field.component';

describe('OrgDateFieldComponent', () => {
  it('renders the shared outlined date field contract', async () => {
    await TestBed.configureTestingModule({ imports: [OrgDateFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgDateFieldComponent> =
      TestBed.createComponent(OrgDateFieldComponent);
    fixture.componentRef.setInput('label', 'Data da celebração');
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;

    expect(field.getAttribute('appearance')).toBe('outline');
    expect(field.textContent).toContain('Data da celebração');
    expect(fixture.nativeElement.querySelector('mat-datepicker-toggle')).toBeTruthy();
  });

  it('supports reactive-form value and disabled contracts', async () => {
    await TestBed.configureTestingModule({ imports: [OrgDateFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgDateFieldComponent);
    const date = new Date(2026, 5, 24);
    fixture.componentInstance.writeValue(date);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(date);
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('masks typed digits as dd/mm/aaaa and hands the form the parsed date', async () => {
    await TestBed.configureTestingModule({ imports: [OrgDateFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgDateFieldComponent);
    const changed = vi.fn();
    fixture.componentInstance.registerOnChange(changed);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '10112026';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('10/11/2026');
    expect(changed).toHaveBeenLastCalledWith(new Date(2026, 10, 10));

    input.value = '02/01/20013';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('02/01/2001');

    input.value = '31/02';
    input.dispatchEvent(new Event('input'));
    const partial = changed.mock.lastCall?.[0] as Date;
    expect(isNaN(partial.getTime())).toBe(true);
    expect(input.value).toBe('31/02');
  });
});

describe('OrgDateAdapter', () => {
  let adapter: OrgDateAdapter;

  beforeEach(() => {
    adapter = TestBed.configureTestingModule({
      providers: [OrgDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
    }).inject(OrgDateAdapter);
  });

  it('reads day first and refuses impossible dates', () => {
    expect(adapter.parse('02/01/2026')).toEqual(new Date(2026, 0, 2));
    expect(adapter.parse('02012026')).toEqual(new Date(2026, 0, 2));
    expect(adapter.isValid(adapter.parse('31/02/2026') as Date)).toBe(false);
    expect(adapter.isValid(adapter.parse('1/1') as Date)).toBe(false);
    expect(adapter.parse('')).toBeNull();
  });

  it('writes the input as dd/mm/aaaa', () => {
    expect(
      adapter.format(new Date(2026, 0, 2), { year: 'numeric', month: 'numeric', day: 'numeric' }),
    ).toBe('02/01/2026');
  });

  it('masks progressively', () => {
    expect(maskDate('1')).toBe('1');
    expect(maskDate('101')).toBe('10/1');
    expect(maskDate('10112026999')).toBe('10/11/2026');
  });
});
