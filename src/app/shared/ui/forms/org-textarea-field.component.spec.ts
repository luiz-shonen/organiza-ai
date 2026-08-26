import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrgTextareaFieldComponent } from './org-textarea-field.component';

describe('OrgTextareaFieldComponent', () => {
  it('renders label, rows and the model value', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextareaFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTextareaFieldComponent> = TestBed.createComponent(OrgTextareaFieldComponent);
    fixture.componentRef.setInput('label', 'Mensagem');
    fixture.componentRef.setInput('rows', 4);
    fixture.componentRef.setInput('value', 'Seja bem-vindo!');
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4);
    expect(textarea.value).toBe('Seja bem-vindo!');
    expect(fixture.nativeElement.textContent).toContain('Mensagem');
  });

  it('uses an empty value by default and prevents model changes while disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextareaFieldComponent] }).compileComponents();
    const fixture: ComponentFixture<OrgTextareaFieldComponent> = TestBed.createComponent(OrgTextareaFieldComponent);
    fixture.componentRef.setInput('label', 'Mensagem');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('error', 'Mensagem obrigatória.');
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'novo valor';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(textarea.disabled).toBe(true);
    expect(fixture.componentInstance.value()).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Mensagem obrigatória.');
  });

  it('supports reactive-form values and touch state', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextareaFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgTextareaFieldComponent);
    const touched = { value: false };
    fixture.componentRef.setInput('label', 'Mensagem');
    fixture.componentInstance.registerOnTouched(() => { touched.value = true; });
    fixture.componentInstance.writeValue('Mensagem inicial');
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.dispatchEvent(new FocusEvent('blur'));

    expect(textarea.value).toBe('Mensagem inicial');
    expect(touched.value).toBe(true);
  });

  it('renders an optional character counter and native bounds', async () => {
    await TestBed.configureTestingModule({ imports: [OrgTextareaFieldComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OrgTextareaFieldComponent);
    fixture.componentRef.setInput('label', 'Mensagem');
    fixture.componentRef.setInput('value', 'Olá');
    fixture.componentRef.setInput('minLength', 5);
    fixture.componentRef.setInput('maxLength', 160);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(160);
    expect(textarea.minLength).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('3 / 160');
  });
});
