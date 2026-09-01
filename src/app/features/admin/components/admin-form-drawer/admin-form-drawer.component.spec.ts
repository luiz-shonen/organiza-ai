import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminFormDrawerComponent } from './admin-form-drawer.component';

describe('AdminFormDrawerComponent', () => {
  let fixture: ComponentFixture<AdminFormDrawerComponent>;
  let component: AdminFormDrawerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFormDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFormDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not render drawer when isOpen is false', () => {
    const dialog = fixture.nativeElement.querySelector('[data-testid="admin-drawer-dialog"]');
    expect(dialog).toBeNull();
  });

  it('should render dialog when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[data-testid="admin-drawer-dialog"]');
    expect(dialog).toBeTruthy();
  });

  it('should emit close when close button is clicked', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('[data-testid="admin-drawer-close-btn"]');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit save with email when form is valid and submitted', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    (component as any).form.controls.email.setValue('newadmin@example.com');
    (component as any).onSubmit();

    expect(saveSpy).toHaveBeenCalledWith('newadmin@example.com');
  });

  it('should not emit save when form is invalid', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    (component as any).form.controls.email.setValue('invalid-email');
    (component as any).onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
