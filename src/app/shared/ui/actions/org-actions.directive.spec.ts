import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { describe, expect, it } from 'vitest';
import { OrgButtonDirective } from './org-button.directive';
import { OrgChipDirective } from './org-chip.directive';
import { OrgIconButtonDirective } from './org-icon-button.directive';

@Component({
  imports: [MatButtonModule, MatChipsModule, OrgButtonDirective, OrgIconButtonDirective, OrgChipDirective],
  template: `
    <button mat-flat-button orgButton="danger" [orgButtonLoading]="true">Excluir</button>
    <button mat-icon-button orgIconButton="primary" aria-label="Abrir menu"></button>
    <mat-chip-option orgChip="success">Confirmado</mat-chip-option>
  `,
})
class ActionsHostComponent {}

describe('shared action directives', () => {
  it('gives loading primary actions a disabled 48px semantic contract', async () => {
    await TestBed.configureTestingModule({ imports: [ActionsHostComponent] }).compileComponents();
    const fixture: ComponentFixture<ActionsHostComponent> = TestBed.createComponent(ActionsHostComponent);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('button[orgButton]') as HTMLButtonElement;
    expect(action.classList.contains('org-button--danger')).toBe(true);
    expect(action.disabled).toBe(true);
    expect(action.getAttribute('aria-busy')).toBe('true');
    expect(action.style.minHeight).toBe('48px');
    expect(action.style.minWidth).toBe('48px');
  });

  it('gives icon buttons and chips their own 48px semantic variants', async () => {
    await TestBed.configureTestingModule({ imports: [ActionsHostComponent] }).compileComponents();
    const fixture: ComponentFixture<ActionsHostComponent> = TestBed.createComponent(ActionsHostComponent);
    fixture.detectChanges();

    const iconButton = fixture.nativeElement.querySelector('button[orgIconButton]') as HTMLButtonElement;
    const chip = fixture.nativeElement.querySelector('mat-chip-option') as HTMLElement;
    expect(iconButton.classList.contains('org-icon-button--primary')).toBe(true);
    expect(iconButton.style.minHeight).toBe('48px');
    expect(chip.classList.contains('org-chip--success')).toBe(true);
    expect(chip.style.minHeight).toBe('48px');
  });
});
