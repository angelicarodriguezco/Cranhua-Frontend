import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RecuperarContrasenaComponent } from './recuperar-contrasena.component';

describe('RecuperarContrasenaComponent', () => {
  let fixture: ComponentFixture<RecuperarContrasenaComponent>;
  let componente: RecuperarContrasenaComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarContrasenaComponent],
      providers: [provideRouter([])],
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

  it('renderiza el paso 1 de recuperación', () => {
    expect(pagina.textContent).toContain('Recuperar contraseña');
    expect(pagina.textContent).toContain('Mandar OTP');
    expect(pagina.textContent).toContain('Volver a iniciar sesión');
  });

  it('no avanza si el correo está vacío o es inválido', () => {
    enviar();

    expect(componente['formCorreo'].controls.correo.touched).toBeTrue();
    expect(componente['formCorreo'].controls.correo.hasError('required')).toBeTrue();
    expect(componente['paso']()).toBe(1);
    expect(pagina.textContent).toContain('Campo requerido');

    componente['formCorreo'].setValue({ correo: 'no-es-email' });
    fixture.detectChanges();
    enviar();

    expect(componente['formCorreo'].controls.correo.hasError('email')).toBeTrue();
    expect(componente['paso']()).toBe(1);
  });

  it('avanza al paso 2 con correo válido y verifica el OTP mock', () => {
    spyOn(console, 'log');

    componente['formCorreo'].setValue({ correo: 'ana@ejemplo.cr' });
    fixture.detectChanges();
    enviar();

    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('Ingresá el código');
    expect(pagina.textContent).toContain('ana@ejemplo.cr');
    expect(console.log).toHaveBeenCalledWith('[recuperar-contrasena] OTP mock:', '123456');

    enviar();
    expect(componente['otpError']()).toBeTrue();
    expect(componente['paso']()).toBe(2);
    expect(pagina.textContent).toContain('Ingresá los 6 dígitos del código');

    completarOtp('000000');
    enviar();
    expect(componente['paso']()).toBe(3);
    expect(pagina.textContent).toContain('Creá una nueva contraseña');
  });

  it('exige contraseñas coincidentes y navega al login', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    componente['formCorreo'].setValue({ correo: 'ana@ejemplo.cr' });
    componente['mandarOtp']();
    completarOtp('123456');
    componente['verificarCodigo']();
    fixture.detectChanges();

    enviar();
    expect(componente['formContrasena'].controls.nueva.hasError('required')).toBeTrue();
    expect(componente['formContrasena'].controls.confirmacion.hasError('required')).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    componente['formContrasena'].setValue({
      nueva: 'NuevaSegura1',
      confirmacion: 'OtraSegura1',
    });
    fixture.detectChanges();
    enviar();

    expect(componente['formContrasena'].hasError('noCoinciden')).toBeTrue();
    expect(pagina.textContent).toContain('Las contraseñas no coinciden');
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    componente['formContrasena'].setValue({
      nueva: 'NuevaSegura1',
      confirmacion: 'NuevaSegura1',
    });
    fixture.detectChanges();
    enviar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/iniciar-sesion');
  });
});
