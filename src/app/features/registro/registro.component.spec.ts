import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let componente: RegistroComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideRouter([])],
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
      contrasena: '12345678',
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

  it('rechaza contraseña de menos de 8 caracteres', () => {
    const contrasena = componente['form'].controls.contrasena;
    contrasena.setValue('1234567');
    expect(contrasena.hasError('minlength')).toBeTrue();
    contrasena.setValue('12345678');
    expect(contrasena.valid).toBeTrue();
  });

  for (const [etiqueta, ruta] of [
    ['Cafetalero', '/onboarding-finca'],
    ['Tostador', '/onboarding-tostador'],
    ['Cafetería', '/onboarding-cafeteria'],
  ]) {
    it(`con el rol ${etiqueta} navega a ${ruta}`, () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');

      chip(etiqueta).click();
      llenarDatos();
      fixture.detectChanges();
      enviar();

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

    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding-finca', {
      state: { nombre: 'Rodrigo Vargas Mora', rolesPendientes: ['cafeteria'] },
    });
  });
});
