import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { USUARIOS, USUARIO_ACTUAL } from '../../core/mocks/finca.mock';
import { SesionService } from '../../core/services/sesion.service';
import { IniciarSesionComponent } from './iniciar-sesion.component';

describe('IniciarSesionComponent', () => {
  let fixture: ComponentFixture<IniciarSesionComponent>;
  let componente: IniciarSesionComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarSesionComponent],
      providers: [provideRouter([])],
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

  it('marca correo y contraseña como requeridos al enviar vacío', () => {
    enviar();

    expect(componente['form'].controls.correo.touched).toBeTrue();
    expect(componente['form'].controls.contrasena.touched).toBeTrue();
    expect(componente['form'].controls.correo.hasError('required')).toBeTrue();
    expect(componente['form'].controls.contrasena.hasError('required')).toBeTrue();
    expect(pagina.textContent).toContain('Campo requerido');
  });

  it('inicia sesión con el usuario del correo y va al dashboard', () => {
    const sesion = TestBed.inject(SesionService);
    const router = TestBed.inject(Router);
    spyOn(sesion, 'iniciarSesion').and.callThrough();
    spyOn(router, 'navigateByUrl');

    const usuario = USUARIOS[3];
    componente['form'].setValue({
      correo: usuario.correo.toUpperCase(),
      contrasena: 'cualquiera',
    });
    fixture.detectChanges();
    enviar();

    expect(sesion.iniciarSesion).toHaveBeenCalledWith(usuario);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('usa USUARIO_ACTUAL si el correo no está en el mock', () => {
    const sesion = TestBed.inject(SesionService);
    const router = TestBed.inject(Router);
    spyOn(sesion, 'iniciarSesion').and.callThrough();
    spyOn(router, 'navigateByUrl');

    componente['form'].setValue({
      correo: 'nadie@ejemplo.cr',
      contrasena: 'cualquiera',
    });
    fixture.detectChanges();
    enviar();

    expect(sesion.iniciarSesion).toHaveBeenCalledWith(USUARIO_ACTUAL);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
