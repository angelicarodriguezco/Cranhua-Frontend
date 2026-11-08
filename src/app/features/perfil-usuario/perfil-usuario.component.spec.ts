import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { ActualizarPerfilDatos } from '../../core/mappers/cuenta.mapper';
import { PERFIL_EJEMPLO } from '../../core/mocks/perfil.mock';
import { PerfilUsuario } from '../../core/models/perfil.model';
import { CuentaService } from '../../core/services/cuenta.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { PerfilService } from '../../core/services/perfil.service';
import { SesionService } from '../../core/services/sesion.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import {
  DESCRIPCION_ELIMINAR_CUENTA,
  enlaceRedSocial,
  inicialesPerfil,
  PerfilUsuarioComponent,
  validarRed,
} from './perfil-usuario.component';

describe('PerfilUsuarioComponent', () => {
  let fixture: ComponentFixture<PerfilUsuarioComponent>;
  let pagina: HTMLElement;
  let perfilService: PerfilService;
  let dashboard: DashboardCafetaleroService;

  function perfilActualizado(datos: ActualizarPerfilDatos): PerfilUsuario {
    return {
      ...PERFIL_EJEMPLO,
      nombreCompleto: datos.nombreCompleto ?? PERFIL_EJEMPLO.nombreCompleto,
      telefono: datos.telefono ?? PERFIL_EJEMPLO.telefono,
      redes: datos.redes ?? PERFIL_EJEMPLO.redes,
    };
  }

  beforeEach(async () => {
    localStorage.removeItem(CLAVE_TEMA);
    await TestBed.configureTestingModule({
      imports: [PerfilUsuarioComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    perfilService = TestBed.inject(PerfilService);
    dashboard = TestBed.inject(DashboardCafetaleroService);
    spyOn(perfilService, 'obtener').and.returnValue(of({ ...PERFIL_EJEMPLO }));
    spyOn(perfilService, 'actualizar').and.callFake((datos: ActualizarPerfilDatos) =>
      of(perfilActualizado(datos)),
    );

    fixture = TestBed.createComponent(PerfilUsuarioComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === texto || b.getAttribute('aria-label') === texto,
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function clic(texto: string): void {
    boton(texto).click();
    fixture.detectChanges();
  }

  function campo<T extends HTMLElement = HTMLInputElement>(selector: string): T {
    return pagina.querySelector<T>(selector)!;
  }

  function escribir(selector: string, valor: string): void {
    const control = campo<HTMLInputElement>(selector);
    control.value = valor;
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function titulo(): string {
    return campo('h1').textContent!.trim();
  }

  function titulosSecciones(): string[] {
    return [...pagina.querySelectorAll('.seccion__titulo, app-zona-peligro h2')].map((h) =>
      h.firstChild!.textContent!.trim(),
    );
  }

  it('calcula iniciales, enlaces y validación de redes', () => {
    expect(inicialesPerfil('Rodrigo Alvarado Castro')).toBe('RA');
    expect(enlaceRedSocial({ tipo: 'instagram', valor: '@fincalacatalina' })).toBe(
      'https://instagram.com/fincalacatalina',
    );
    expect(enlaceRedSocial({ tipo: 'whatsapp', valor: '+506 8888-4321' })).toBe(
      'https://wa.me/50688884321',
    );
    expect(enlaceRedSocial({ tipo: 'sitio', valor: 'lacatalina.cr' })).toBe(
      'https://lacatalina.cr',
    );

    expect(validarRed({ tipo: 'instagram', valor: '@finca.la_catalina' })).toBeNull();
    expect(validarRed({ tipo: 'instagram', valor: 'finca la catalina' })).not.toBeNull();
    expect(validarRed({ tipo: 'whatsapp', valor: '8888-4321' })).toBeNull();
    expect(validarRed({ tipo: 'whatsapp', valor: '1234' })).not.toBeNull();
    expect(validarRed({ tipo: 'sitio', valor: 'https://lacatalina.cr/cafe' })).toBeNull();
    expect(validarRed({ tipo: 'sitio', valor: 'lacatalina' })).not.toBeNull();
    expect(validarRed({ tipo: 'facebook', valor: '  ' })).toBe(
      'Completá el enlace o quitá esta red.',
    );
  });

  it('la vista muestra los datos, redes, apariencia y la cuenta, sin zona de peligro', () => {
    const indicadores = dashboard.indicadores();

    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain('Así te ven los demás dentro de Crán̈hua.');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.nombreCompleto);
    expect(campo('.badge').textContent).toContain('Cafetalero');
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('RA');

    const chips = [...pagina.querySelectorAll<HTMLAnchorElement>('.chips a')];
    expect(chips.map((c) => c.textContent!.trim())).toEqual(['Instagram', 'WhatsApp']);
    expect(chips.every((c) => c.target === '_blank')).toBeTrue();

    const kpis = [...pagina.querySelectorAll('.indicadores article')].map(
      (a) => `${a.querySelector('strong')!.textContent} ${a.querySelector('span')!.textContent}`,
    );
    expect(kpis).toEqual([
      `${indicadores.fincasRegistradas} Fincas registradas`,
      `${indicadores.cosechasActivas} Cosechas activas`,
    ]);

    const datos = campo('.datos').textContent!;
    expect(datos).toContain('rodrigo@fincalacatalina.cr');
    expect(datos).toContain('+506 8888-4321');
    expect(datos).toContain('Cafetalero');

    expect(titulosSecciones()).toEqual([
      'Información de la cuenta',
      'Redes sociales',
      'Preferencias',
    ]);
    expect(pagina.textContent).toContain('Apariencia');
    expect(pagina.querySelector('[role="switch"]')).toBeTruthy();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
  });

  it('editar muestra todo en una sola página con los datos cargados', () => {
    clic('Editar perfil');

    expect(titulo()).toBe('Editar perfil');
    expect(pagina.textContent).toContain(
      'Actualizá tu foto de portada, tu información y tus redes sociales.',
    );
    expect(pagina.textContent).not.toContain('de 2)');
    expect(() => boton('Siguiente')).toThrow();

    expect(campo('#nombre-perfil').value).toBe(PERFIL_EJEMPLO.nombreCompleto);
    expect(campo('#correo-perfil').value).toBe(PERFIL_EJEMPLO.correo);
    expect(campo('#correo-perfil').readOnly).toBeTrue();
    expect(campo('#telefono-perfil').value).toBe(PERFIL_EJEMPLO.telefono);
    expect(pagina.querySelector('#ubicacion-perfil')).toBeNull();
    expect(pagina.querySelector('#biografia-perfil')).toBeNull();
    expect(pagina.querySelector('.portada__cambiar')).toBeTruthy();
    expect(pagina.querySelector('.avatar__camara')).toBeTruthy();
    expect(pagina.querySelector('#contrasena-actual')).toBeNull();

    expect(titulosSecciones()).toEqual(['Redes sociales', 'Zona de peligro']);
    expect(boton('Guardar cambios')).toBeTruthy();
  });

  it('"Guardar cambios" guarda sin foto y vuelve a la vista con el dato editado', () => {
    clic('Editar perfil');
    escribir('#nombre-perfil', 'Rodrigo Alvarado');
    clic('Guardar cambios');

    expect(perfilService.actualizar).toHaveBeenCalledWith({
      nombreCompleto: 'Rodrigo Alvarado',
      telefono: PERFIL_EJEMPLO.telefono,
      redes: PERFIL_EJEMPLO.redes,
    });
    expect(titulo()).toBe('Mi perfil');
    expect(campo('.identidad h2').textContent!.trim()).toBe('Rodrigo Alvarado');
  });

  it('Cancelar y Volver descartan los cambios', () => {
    clic('Editar perfil');
    escribir('#nombre-perfil', 'Otro nombre');
    clic('Cancelar');
    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.nombreCompleto);

    clic('Editar perfil');
    expect(campo('#nombre-perfil').value).toBe(PERFIL_EJEMPLO.nombreCompleto);
    escribir('#nombre-perfil', 'Nombre temporal');
    clic('Quitar Instagram');
    clic('← Volver');

    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.nombreCompleto);
    expect([...pagina.querySelectorAll('.chips a')].length).toBe(2);
    expect(perfilService.actualizar).not.toHaveBeenCalled();
  });

  const invalidos: [string, string, string][] = [
    ['#nombre-perfil', '', 'Poné tu nombre completo.'],
    ['#nombre-perfil', '    ', 'Poné tu nombre completo.'],
    ['#telefono-perfil', '8888-432', 'Ingresá un teléfono de 8 dígitos.'],
  ];

  invalidos.forEach(([selector, valor, mensaje]) => {
    it(`no guarda con ${selector} = "${valor}" y lleva al campo con error`, async () => {
      const desplazar = spyOn(HTMLElement.prototype, 'scrollIntoView');

      clic('Editar perfil');
      escribir(selector, valor);
      clic('Guardar cambios');
      await fixture.whenStable();

      expect(perfilService.actualizar).not.toHaveBeenCalled();
      expect(titulo()).toBe('Editar perfil');
      expect(pagina.textContent).toContain(mensaje);
      expect(campo(selector).getAttribute('aria-invalid')).toBe('true');
      expect(desplazar).toHaveBeenCalled();
      expect(document.activeElement).toBe(campo(selector));
    });
  });

  it('acepta teléfonos con +506, espacios y guiones', () => {
    clic('Editar perfil');
    for (const valido of ['88884321', '8888 4321', '+506 8888-4321', '+5068888-4321']) {
      escribir('#telefono-perfil', valido);
      expect(campo('#telefono-perfil').getAttribute('aria-invalid'))
        .withContext(valido)
        .not.toBe('true');
    }
  });

  it('agrega y quita redes sin repetir tipo', () => {
    clic('Editar perfil');
    expect(pagina.querySelectorAll('.red').length).toBe(2);

    clic('+ Agregar red social');
    const opciones = [...pagina.querySelectorAll('.selector-red button')].map((b) =>
      b.textContent!.trim(),
    );
    expect(opciones).toEqual(['Facebook', 'Sitio web']);

    clic('Facebook');
    expect(pagina.querySelectorAll('.red').length).toBe(3);
    escribir('#red-facebook', 'facebook.com/lacatalina');

    clic('+ Agregar red social');
    expect([...pagina.querySelectorAll('.selector-red button')].map((b) => b.textContent!.trim()))
      .withContext('ya no ofrece Facebook')
      .toEqual(['Sitio web']);
    clic('Sitio web');
    expect(pagina.querySelector('.agregar-red')).toBeNull();
    escribir('#red-sitio', 'lacatalina.cr');

    clic('Quitar Instagram');
    expect(pagina.querySelector('#red-instagram')).toBeNull();
    expect(pagina.querySelector('.agregar-red')).toBeTruthy();

    clic('Guardar cambios');
    const chips = [...pagina.querySelectorAll('.chips a')].map((c) => c.textContent!.trim());
    expect(chips).toEqual(['WhatsApp', 'Facebook', 'Sitio web']);
  });

  it('no guarda con una red vacía o inválida', async () => {
    spyOn(HTMLElement.prototype, 'scrollIntoView');

    clic('Editar perfil');
    clic('+ Agregar red social');
    clic('Sitio web');
    clic('Guardar cambios');
    await fixture.whenStable();

    expect(perfilService.actualizar).not.toHaveBeenCalled();
    expect(campo('#error-red-sitio').textContent).toContain('Completá el enlace o quitá esta red.');
    expect(campo('#red-sitio').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(campo('#red-sitio'));

    escribir('#red-sitio', 'lacatalina');
    clic('Guardar cambios');
    expect(perfilService.actualizar).not.toHaveBeenCalled();
    expect(campo('#error-red-sitio').textContent).toContain('Ingresá un enlace válido');
  });

  it('el switch de apariencia cambia el tema global y el data-theme del host', () => {
    const temas = TestBed.inject(TemaService);
    const interruptor = campo<HTMLButtonElement>('[role="switch"]');
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    expect(interruptor.getAttribute('aria-checked')).toBe('true');

    interruptor.click();
    fixture.detectChanges();
    expect(temas.tema()).toBe('claro');
    expect(dashboard.tema()).toBe('claro');
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
  });

  it('eliminar cuenta: cancelar cierra el modal y confirmar limpia sesión y navega a iniciar sesión', () => {
    const router = TestBed.inject(Router);
    const cuentaService = TestBed.inject(CuentaService);
    const sesionService = TestBed.inject(SesionService);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(perfilService, 'eliminarCuenta').and.returnValue(of(undefined));

    clic('Editar perfil');
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_CUENTA);

    clic('Eliminar mi cuenta');
    expect(campo('.modal__titulo').textContent).toBe('¿Eliminar tu cuenta?');
    expect(campo('.modal__mensaje').textContent).toBe('Esta acción no se puede deshacer.');
    expect(campo('.modal__aviso').textContent).toContain(DESCRIPCION_ELIMINAR_CUENTA);
    campo<HTMLButtonElement>('.modal__btn--secundario').click();
    fixture.detectChanges();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeNull();
    expect(eliminar).not.toHaveBeenCalled();

    clic('Eliminar mi cuenta');
    expect(campo('.modal__btn--peligro').textContent!.trim()).toBe('Sí, entiendo. Eliminar');
    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalled();
    expect(cuentaService.cuenta()).toBeNull();
    expect(sesionService.usuario()).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('el modal de eliminar cuenta sigue el tema global', () => {
    clic('Editar perfil');
    clic('Eliminar mi cuenta');
    const fondo = () => getComputedStyle(campo('.modal__dialogo')).backgroundColor;
    expect(fondo()).toBe('rgba(8, 28, 38, 0.96)');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();

    expect(fondo()).toBe('rgb(255, 255, 255)');
  });
});
