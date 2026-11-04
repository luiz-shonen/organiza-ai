import { TestBed } from '@angular/core/testing';
import { MatChipEditedEvent } from '@angular/material/chips';
import { describe, expect, it, vi } from 'vitest';
import { OrgEditableChipComponent } from './org-editable-chip.component';

async function create(value: string | null) {
  await TestBed.configureTestingModule({ imports: [OrgEditableChipComponent] }).compileComponents();
  const fixture = TestBed.createComponent(OrgEditableChipComponent);
  fixture.componentRef.setInput('placeholder', 'Personalizar');
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('maxLength', 10);
  fixture.detectChanges();
  const changed = vi.fn();
  fixture.componentInstance.valueChange.subscribe(changed);
  const finish = (text: string) =>
    fixture.componentInstance['finish']({ value: text } as MatChipEditedEvent);
  return { fixture, changed, finish };
}

describe('OrgEditableChipComponent', () => {
  it('shows the placeholder while empty and the value once set, with a clear button', async () => {
    const { fixture } = await create(null);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Personalizar');
    expect(element.querySelector('[matChipRemove]')).toBeNull();

    fixture.componentRef.setInput('value', 'Bodas');
    fixture.detectChanges();
    expect(element.textContent).toContain('Bodas');
    expect(element.querySelector('[matChipRemove]')).toBeTruthy();
  });

  it('commits trimmed text, cut to the maximum length', async () => {
    const { changed, finish } = await create(null);
    finish('  Chá revelação  ');
    expect(changed).toHaveBeenCalledWith('Chá revela');
  });

  it('keeps the previous value for an empty, unchanged or cancelled edit', async () => {
    const { fixture, changed, finish } = await create('Bodas');
    finish('   ');
    finish('Bodas');
    fixture.componentInstance['cancel']();
    finish('Outra coisa');
    expect(changed).not.toHaveBeenCalled();

    finish('Aniversário');
    expect(changed).toHaveBeenCalledWith('Aniversári');
  });
});
