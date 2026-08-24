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
});
