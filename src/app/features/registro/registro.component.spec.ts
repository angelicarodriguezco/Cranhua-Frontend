import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CuentaResponseApi } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let componente: RegistroComponent;
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
      'registrar',
      'registrarConGoogle',
      'aplicarSesion',
    ]);
    googleIdentity = jasmine.createSpyObj<GoogleIdentityService>('GoogleIdentityService', [
      'obtenerCredencial',
    ]);
    auth.registrar.and.returnValue(of(cuentaApi));
    auth.registrarConGoogle.and.returnValue(of(cuentaApi));
    googleIdentity.obtenerCredencial.and.resolveTo('token-google');

    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: GoogleIdentityService, useValue: googleIdentity },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function enviar(): void {
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  function chip(etiqueta: string): HTMLButtonElement {
    const chips = Array.from(pagina.querySelectorAll<HTMLButtonElement>('.roles__chip'));
    return chips.find((c) => c.textContent?.trim() === etiqueta)!;
  }

  function llenarDatos(): void {
    componente['form'].patchValue({
      nombre: 'Rodrigo Vargas Mora',
      correo: 'rodrigo@fincalacatalina.cr',
      telefono: '+506 8888-0000',
      contrasena: 'Cafe2026!',
    });
  }

  it('muestra los tres roles y los seis campos del formulario', () => {
    expect(pagina.querySelectorAll('.roles__chip').length).toBe(3);
    for (const id of ['nombre', 'correo', 'telefono', 'contrasena', 'instagram', 'foto']) {
      expect(pagina.querySelector(`#${id}`))
        .withContext(id)
        .not.toBeNull();
    }
  });

  it('marca los campos obligatorios y no navega al enviar vacío', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    enviar();

    const controles = componente['form'].controls;
    expect(controles.roles.hasError('sinRol')).toBeTrue();
    expect(controles.nombre.hasError('required')).toBeTrue();
    expect(controles.correo.hasError('required')).toBeTrue();
    expect(controles.telefono.hasError('required')).toBeTrue();
    expect(controles.contrasena.hasError('required')).toBeTrue();
    expect(pagina.textContent).toContain('Elegí al menos un rol');
    expect(auth.registrar).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('Instagram y foto son opcionales', () => {
    expect(componente['form'].controls.instagram.valid).toBeTrue();
    expect(componente['form'].controls.foto.valid).toBeTrue();
  });

  it('permite elegir varios roles y desmarcarlos', () => {
    chip('Tostador').click();
    chip('Cafetería').click();
    fixture.detectChanges();
    expect(componente['form'].controls.roles.value).toEqual(['tostador', 'cafeteria']);
    expect(chip('Tostador').getAttribute('aria-pressed')).toBe('true');

    chip('Tostador').click();
    fixture.detectChanges();
    expect(componente['form'].controls.roles.value).toEqual(['cafeteria']);
    expect(chip('Tostador').getAttribute('aria-pressed')).toBe('false');
  });

  it('rechaza contraseña sin letra o sin número', () => {
    const contrasena = componente['form'].controls.contrasena;
    contrasena.setValue('1234567');
    expect(contrasena.hasError('minlength')).toBeTrue();

    contrasena.setValue('12345678');
    expect(contrasena.hasError('letraYNumero')).toBeTrue();

    contrasena.setValue('cafecafe');
    expect(contrasena.hasError('letraYNumero')).toBeTrue();

    contrasena.setValue('Cafe2026!');
    expect(contrasena.valid).toBeTrue();
  });

  for (const [etiqueta, ruta, rolApi] of [
    ['Cafetalero', '/onboarding-finca', 'CAFETALERO'],
    ['Tostador', '/onboarding-tostador', 'TOSTADOR'],
    ['Cafetería', '/onboarding-cafeteria', 'CAFETERIA'],
  ] as const) {
    it(`con el rol ${etiqueta} registra y navega a ${ruta}`, () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');

      chip(etiqueta).click();
      llenarDatos();
      fixture.detectChanges();
      enviar();

      expect(auth.registrar).toHaveBeenCalledWith({
        nombreCompleto: 'Rodrigo Vargas Mora',
        correo: 'rodrigo@fincalacatalina.cr',
        contrasena: 'Cafe2026!',
        roles: [rolApi],
        telefono: '+506 8888-0000',
      });
      expect(auth.aplicarSesion).toHaveBeenCalledWith(cuentaApi);
      expect(router.navigateByUrl).toHaveBeenCalledWith(ruta, jasmine.anything());
    });
  }

  it('con varios roles va al primero y pasa los demás como pendientes', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    chip('Cafetería').click();
    chip('Cafetalero').click();
    llenarDatos();
    fixture.detectChanges();
    enviar();

    expect(auth.registrar).toHaveBeenCalledWith(
      jasmine.objectContaining({ roles: ['CAFETERIA', 'CAFETALERO'] }),
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding-finca', {
      state: { nombre: 'Rodrigo Vargas Mora', rolesPendientes: ['cafeteria'] },
    });
  });

  it('muestra el error del backend al fallar el registro por correo', () => {
    auth.registrar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'Ya existe una cuenta con ese correo.' },
          }),
      ),
    );
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    chip('Cafetalero').click();
    llenarDatos();
    fixture.detectChanges();
    enviar();

    expect(pagina.textContent).toContain('Ya existe una cuenta con ese correo.');
    expect(auth.aplicarSesion).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('Google exige al menos un rol antes de abrir GIS', fakeAsync(() => {
    pagina.querySelector<HTMLButtonElement>('.registro__google')!.click();
    tick();
    fixture.detectChanges();

    expect(componente['form'].controls.roles.hasError('sinRol')).toBeTrue();
    expect(googleIdentity.obtenerCredencial).not.toHaveBeenCalled();
    expect(auth.registrarConGoogle).not.toHaveBeenCalled();
  }));

  it('Google registra con roles seleccionados y navega al onboarding', fakeAsync(() => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    chip('Tostador').click();
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('.registro__google')!.click();
    tick();
    fixture.detectChanges();

    expect(googleIdentity.obtenerCredencial).toHaveBeenCalled();
    expect(auth.registrarConGoogle).toHaveBeenCalledWith({
      credencial: 'token-google',
      roles: ['TOSTADOR'],
    });
    expect(auth.aplicarSesion).toHaveBeenCalledWith(cuentaApi);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding-tostador', {
      state: { nombre: 'Rodrigo Vargas Mora', rolesPendientes: [] },
    });
  }));
});
