import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginContainer } from './login.container';
import { AuthService } from '../../../core/services';

describe('LoginContainer', () => {
  let fixture: ComponentFixture<LoginContainer>;
  let component: LoginContainer;
  let router: Router;

  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      loginWithGoogle: vi.fn().mockResolvedValue(undefined),
      isAdmin: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [LoginContainer, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and initialize form with default values', () => {
    expect(component).toBeTruthy();
    expect(component['form'].valid).toBe(false);
    expect(component['loading']()).toBe(false);
    expect(component['errorMessage']()).toBe('');
    expect(component['hidePassword']()).toBe(true);
  });

  it('should toggle password visibility signal', () => {
    expect(component['hidePassword']()).toBe(true);
    component['hidePassword'].set(false);
    expect(component['hidePassword']()).toBe(false);
  });

  it('should log in and navigate to "/meus-eventos" for regular user', async () => {
    mockAuthService.isAdmin.set(false);
    component['form'].setValue({
      email: 'user@example.com',
      password: 'password123',
    });

    await component['submit']();

    expect(mockAuthService.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/meus-eventos']);
    expect(component['loading']()).toBe(false);
  });

  it('should keep Super Admin password login on the organizer dashboard', async () => {
    mockAuthService.isAdmin.set(true);
    component['form'].setValue({
      email: 'admin@example.com',
      password: 'password123',
    });

    await component['submit']();

    expect(mockAuthService.login).toHaveBeenCalledWith('admin@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/meus-eventos']);
  });

  it('should attempt automatic registration when login throws user-not-found', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('auth/user-not-found'));
    mockAuthService.isAdmin.set(false);
    component['form'].setValue({
      email: 'newuser@example.com',
      password: 'password123',
    });

    await component['submit']();

    expect(mockAuthService.register).toHaveBeenCalledWith('newuser@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/meus-eventos']);
  });

  it('should handle registration errors when fallback registration fails', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('invalid-credential'));
    mockAuthService.register.mockRejectedValueOnce(new Error('weak-password'));
    component['form'].setValue({
      email: 'user@example.com',
      password: '123456',
    });

    await component['submit']();

    expect(component['errorMessage']()).toBe('A senha deve ter pelo menos 6 caracteres.');
  });

  it('should handle wrong password login error', async () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('wrong-password'));
    component['form'].setValue({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    await component['submit']();

    expect(component['errorMessage']()).toBe('E-mail ou senha incorretos.');
  });

  it('should login with Google and redirect successfully', async () => {
    mockAuthService.isAdmin.set(false);
    await component['loginWithGoogle']();

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/meus-eventos']);
    expect(component['loading']()).toBe(false);
  });

  it('should handle Google login error with NOT_ADMIN message', async () => {
    mockAuthService.loginWithGoogle.mockRejectedValueOnce(new Error('NOT_ADMIN'));
    await component['loginWithGoogle']();

    expect(component['errorMessage']()).toBe('Acesso Negado: Seu e-mail não tem permissão.');
    expect(component['loading']()).toBe(false);
  });

  it('should handle generic Google login error', async () => {
    mockAuthService.loginWithGoogle.mockRejectedValueOnce(new Error('Popup closed'));
    await component['loginWithGoogle']();

    expect(component['errorMessage']()).toBe('Falha ao autenticar com o Google.');
    expect(component['loading']()).toBe(false);
  });
});
