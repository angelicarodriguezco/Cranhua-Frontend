import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Navigation, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CuentaResponseApi } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { IniciarSesionComponent } from './iniciar-sesion.component';

describe('IniciarSesionComponent', () => {
  let fixture: ComponentFixture<IniciarSesionComponent>;
  let componente: IniciarSesionComponent;
  let pagina: HTMLElement;
  let auth: jasmine.SpyObj<AuthService>;
  let googleIdentity: jasmine.SpyObj<GoogleIdentityService>;

  const cuentaApi: CuentaResponseApi = {
    id: 'uuid-1',
    nombreCompleto: 'Rodrigo Vargas Mora',
    correo: 'rodrigo@fincalacatalina.cr',
    roles: ['CAFETALERO'],
  };

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'iniciarSesion',
      'iniciarSesionConGoogle',
      'aplicarSesion',
    ]);
    googleIdentity = jasmine.createSpyObj<GoogleIdentityService>('GoogleIdentityService', [
      'obtenerCredencial',
    ]);
    auth.iniciarSesion.and.returnValue(of(cuentaApi));
    auth.iniciarSesionConGoogle.and.returnValue(of(cuentaApi));
    googleIdentity.obtenerCredencial.and.resolveTo('token-google');

    await TestBed.configureTestingModule({
      imports: [IniciarSesionComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: GoogleIdentityService, useValue: googleIdentity },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IniciarSesionComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function enviar(): void {
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  function llenarDatos(): void {
    componente['form'].setValue({
      correo: 'rodrigo@fincalacatalina.cr',
      contrasena: 'Cafe2026!',
    });
  }

  it('no muestra mensaje de éxito al entrar directo', () => {
    expect(pagina.querySelector('.login__exito')).toBeNull();
  });

  it('muestra el mensaje de éxito que llega en el state de la navegación', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: { state: { mensaje: 'Tu contraseña se cambió.' } },
    } as unknown as Navigation);

    const otro = TestBed.createComponent(IniciarSesionComponent);
    otro.detectChanges();

    const aviso = (otro.nativeElement as HTMLElement).querySelector('.login__exito');
    expect(aviso?.textContent).toContain('Tu contraseña se cambió.');
  });

  it('marca correo y contraseña como requeridos al enviar vacío', () => {
    enviar();

    expect(componente['form'].controls.correo.touched).toBeTrue();
    expect(componente['form'].controls.contrasena.touched).toBeTrue();
    expect(componente['form'].controls.correo.hasError('required')).toBeTrue();
    expect(componente['form'].controls.contrasena.hasError('required')).toBeTrue();
    expect(pagina.textContent).toContain('Campo requerido');
    expect(auth.iniciarSesion).not.toHaveBeenCalled();
  });

  it('inicia sesión por correo, aplica sesión y va al dashboard del primer rol', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    llenarDatos();
    fixture.detectChanges();
    enviar();

    expect(auth.iniciarSesion).toHaveBeenCalledWith({
      correo: 'rodrigo@fincalacatalina.cr',
      contrasena: 'Cafe2026!',
    });
    expect(auth.aplicarSesion).toHaveBeenCalledWith(cuentaApi);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cafetalero/dashboard');
  });

  for (const [rolApi, ruta] of [
    ['TOSTADOR', '/tostador/dashboard'],
    ['CAFETERIA', '/cafeteria/dashboard'],
  ] as const) {
    it(`con rol ${rolApi} navega a ${ruta}`, () => {
      const cuenta: CuentaResponseApi = { ...cuentaApi, roles: [rolApi] };
      auth.iniciarSesion.and.returnValue(of(cuenta));
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');

      llenarDatos();
      fixture.detectChanges();
      enviar();

      expect(router.navigateByUrl).toHaveBeenCalledWith(ruta);
    });
  }

  it('muestra el error del backend al fallar el login por correo', () => {
    auth.iniciarSesion.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { mensaje: 'Correo o contraseña incorrectos.' },
          }),
      ),
    );
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    llenarDatos();
    fixture.detectChanges();
    enviar();

    expect(pagina.textContent).toContain('Correo o contraseña incorrectos.');
    expect(auth.aplicarSesion).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('Google obtiene credencial, inicia sesión y navega al dashboard', fakeAsync(() => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    pagina.querySelector<HTMLButtonElement>('.login__google')!.click();
    tick();
    fixture.detectChanges();

    expect(googleIdentity.obtenerCredencial).toHaveBeenCalled();
    expect(auth.iniciarSesionConGoogle).toHaveBeenCalledWith({ credencial: 'token-google' });
    expect(auth.aplicarSesion).toHaveBeenCalledWith(cuentaApi);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cafetalero/dashboard');
  }));

  it('muestra el error del backend al fallar el login con Google', fakeAsync(() => {
    auth.iniciarSesionConGoogle.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { mensaje: 'No hay una cuenta registrada con ese Google.' },
          }),
      ),
    );
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    pagina.querySelector<HTMLButtonElement>('.login__google')!.click();
    tick();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('No hay una cuenta registrada con ese Google.');
    expect(auth.aplicarSesion).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }));
});
