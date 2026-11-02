import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewPartyItem } from '../../../../../core/models';
import { EventItemsStepComponent } from './event-items-step.component';

describe('EventItemsStepComponent', () => {
  let fixture: ComponentFixture<EventItemsStepComponent>;
  let component: EventItemsStepComponent;
  let added: ReturnType<typeof vi.fn<(item: NewPartyItem) => void>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventItemsStepComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(EventItemsStepComponent);
    component = fixture.componentInstance;
    added = vi.fn<(item: NewPartyItem) => void>();
    component.add.subscribe(added);
    fixture.detectChanges();
  });

  it('adds an item with the tidied name and a whole quantity', () => {
    component['name'].set('  Pipoca   doce ');
    component['quantity'].set('3');
    component['submit']();

    expect(added).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pipoca doce', quantity: 3, unit: 'un.' }),
    );
  });

  it('refuses markup in the name and shows why', () => {
    component['name'].set('<script>');
    component['submit']();
    fixture.detectChanges();

    expect(added).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Não use os caracteres < > { }');
  });

  it('blocks a quantity outside 1 to 999 or with decimals', () => {
    component['name'].set('Refrigerante');
    for (const quantity of ['0', '1000', '1.5']) {
      component['quantity'].set(quantity);
      fixture.detectChanges();
      expect(component['canAdd']()).toBe(false);
      expect(fixture.nativeElement.textContent).toContain('Use um número inteiro de 1 a 999');
    }
  });
});
