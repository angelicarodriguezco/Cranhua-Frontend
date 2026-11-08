import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  MENSAJE_CONTRASENA_RESTABLECIDA,
  RecuperarContrasenaComponent,
} from './recuperar-contrasena.component';

function error400(cuerpo: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status: 400, error: cuerpo });
}

describe('RecuperarContrasenaComponent', () => {
  let fixture: ComponentFixture<RecuperarContrasenaComponent>;
  let componente: RecuperarContrasenaComponent;
  let pagina: HTMLElement;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'solicitarRecuperacion',
      'verificarCodigo',
      'restablecerContrasena',
    ]);
    auth.solicitarRecuperacion.and.returnValue(of(undefined));
    auth.verificarCodigo.and.returnValue(of(undefined));
    auth.restablecerContrasena.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [RecuperarContrasenaComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarContrasenaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function enviar(): void {
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  function completarOtp(codigo: string): void {
    const digitos = componente['otpDigits'];
    for (let i = 0; i < codigo.length; i++) {
      digitos[i].setValue(codigo[i]);
      digitos[i].markAsTouched();
    }
    fixture.detectChanges();
  }

  function irAlPaso2(): void {
    componente['formCorreo'].setValue({ correo: 'ana@ejemplo.cr' });
    fixture.detectChanges();
    enviar();
  }

  function irAlPaso3(): void {
    irAlPaso2();
    completarOtp('123456');
    enviar();
  }

  function llenarContrasena(nueva: string, confirmacion = nueva): void {
    componente['formContrasena'].setValue({ nueva, confirmacion });
    fixture.detectChanges();
  }

  it('renderiza el paso 1 de recuperación', () => {
    expect(pagina.textContent).toContain('Recuperar contraseña');
    expect(pagina.textContent).toContain('Mandar OTP');
    expect(pagina.textContent).toContain('Volver a iniciar sesión');
  });

  it('no llama al backend si el correo está vacío o es inválido', () => {
    enviar();

    expect(componente['formCorreo'].controls.correo.hasError('required')).toBeTrue();
    expect(pagina.textContent).toContain('Campo requerido');

    componente['formCorreo'].setValue({ correo: 'no-es-email' });
    fixture.detectChanges();
    enviar();

    expect(componente['formCorreo'].controls.correo.hasError('email')).toBeTrue();
    expect(componente['paso']()).toBe(1);
    expect(auth.solicitarRecuperacion).not.toHaveBeenCalled();
  });

  it('paso 1 pide el código al backend y avanza al paso 2', () => {
    irAlPaso2();

    expect(auth.solicitarRecuperacion).toHaveBeenCalledWith({ correo: 'ana@ejemplo.cr' });
    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('ana@ejemplo.cr');
  });

  it('paso 1 se queda y muestra el error si falla la solicitud', () => {
    auth.solicitarRecuperacion.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    irAlPaso2();

    expect(componente['paso']()).toBe(1);
    expect(pagina.textContent).toContain('No se pudo completar la solicitud');
  });

  it('paso 2 exige los 6 dígitos antes de llamar al backend', () => {
    irAlPaso2();
    enviar();

    expect(pagina.textContent).toContain('Ingresá los 6 dígitos del código');
    expect(auth.verificarCodigo).not.toHaveBeenCalled();
  });

  it('paso 2 verifica el código con el backend y avanza al paso 3', () => {
    irAlPaso3();

    expect(auth.verificarCodigo).toHaveBeenCalledWith({
      correo: 'ana@ejemplo.cr',
      codigo: '123456',
    });
    expect(componente['paso']()).toBe(3);
    expect(pagina.textContent).toContain('Creá una nueva contraseña');
  });

  it('paso 2 muestra el error de código incorrecto', () => {
    auth.verificarCodigo.and.returnValue(
      throwError(() => error400({ mensaje: 'El código es incorrecto.' })),
    );

    irAlPaso3();

    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('El código es incorrecto.');
  });

  it('paso 2 muestra el error de código vencido', () => {
    auth.verificarCodigo.and.returnValue(
      throwError(() => error400({ mensaje: 'El código venció. Pedí uno nuevo.' })),
    );

    irAlPaso3();

    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('El código venció. Pedí uno nuevo.');
  });

  it('reparte el código cuando llegan varios dígitos en una casilla (autocompletado)', () => {
    irAlPaso2();
    const primera = pagina.querySelector<HTMLInputElement>('.recuperar__otp-casilla')!;
    primera.value = '482915';
    primera.dispatchEvent(new InputEvent('input', { data: '482915' }));
    fixture.detectChanges();

    const valores = Array.from(
      pagina.querySelectorAll<HTMLInputElement>('.recuperar__otp-casilla'),
      (casilla) => casilla.value,
    );
    expect(valores).toEqual(['4', '8', '2', '9', '1', '5']);
  });

  it('al escribir sobre una casilla llena reemplaza el dígito', () => {
    irAlPaso2();
    completarOtp('1');
    const primera = pagina.querySelector<HTMLInputElement>('.recuperar__otp-casilla')!;
    primera.value = '17';
    primera.dispatchEvent(new InputEvent('input', { data: '7' }));
    fixture.detectChanges();

    expect(componente['otpDigits'][0].value).toBe('7');
    expect(componente['otpDigits'][1].value).toBe('');
  });

  it('reenviar pide un código nuevo y limpia las casillas', () => {
    irAlPaso2();
    completarOtp('12');

    pagina.querySelector<HTMLButtonElement>('.recuperar__reenvio-enlace')!.click();
    fixture.detectChanges();

    expect(auth.solicitarRecuperacion).toHaveBeenCalledTimes(2);
    expect(componente['otpDigits'].every((c) => c.value === '')).toBeTrue();
    expect(pagina.textContent).toContain('Código reenviado');
  });

  it('paso 3 valida la contraseña antes de llamar al backend', () => {
    irAlPaso3();

    llenarContrasena('corta1');
    enviar();
    expect(pagina.textContent).toContain('Debe tener entre 8 y 72 caracteres');

    llenarContrasena('sinnumeros');
    enviar();
    expect(pagina.textContent).toContain('Debe tener al menos una letra y un número');

    llenarContrasena('NuevaSegura1', 'OtraSegura1');
    enviar();
    expect(pagina.textContent).toContain('Las contraseñas no coinciden');

    expect(auth.restablecerContrasena).not.toHaveBeenCalled();
  });

  it('paso 3 muestra la contraseña inválida que devuelve el backend', () => {
    auth.restablecerContrasena.and.returnValue(
      throwError(() =>
        error400({
          mensaje: 'Revisá los datos ingresados.',
          errores: { contrasena: 'La contraseña debe tener entre 8 y 72 caracteres.' },
        }),
      ),
    );

    irAlPaso3();
    llenarContrasena('NuevaSegura1');
    enviar();

    expect(componente['paso']()).toBe(3);
    expect(pagina.textContent).toContain('La contraseña debe tener entre 8 y 72 caracteres.');
  });

  it('paso 3 vuelve al paso 2 si el código venció mientras tanto', () => {
    auth.restablecerContrasena.and.returnValue(
      throwError(() => error400({ mensaje: 'El código venció. Pedí uno nuevo.' })),
    );

    irAlPaso3();
    llenarContrasena('NuevaSegura1');
    enviar();

    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('El código venció. Pedí uno nuevo.');
  });

  it('paso 3 restablece y redirige a iniciar sesión con mensaje de éxito', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    irAlPaso3();
    llenarContrasena('NuevaSegura1');
    enviar();

    expect(auth.restablecerContrasena).toHaveBeenCalledWith({
      correo: 'ana@ejemplo.cr',
      codigo: '123456',
      contrasena: 'NuevaSegura1',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/iniciar-sesion', {
      state: { mensaje: MENSAJE_CONTRASENA_RESTABLECIDA },
    });
  });
});
