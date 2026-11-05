import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PERFIL_EJEMPLO } from '../../core/mocks/perfil.mock';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { PerfilService } from '../../core/services/perfil.service';
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

  beforeEach(async () => {
    localStorage.removeItem(CLAVE_TEMA);
    await TestBed.configureTestingModule({
      imports: [PerfilUsuarioComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    perfilService = TestBed.inject(PerfilService);
    dashboard = TestBed.inject(DashboardCafetaleroService);
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

  it('la vista muestra los datos, los indicadores y la cuenta, sin secciones de edición', () => {
    const indicadores = dashboard.indicadores();

    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain('Así te ven los demás dentro de Crán̈hua.');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.nombreCompleto);
    expect(campo('.badge').textContent).toContain('Cafetalero');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.ubicacion);
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.biografia);
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
      '2024 Miembro desde',
    ]);

    const datos = campo('.datos').textContent!;
    expect(datos).toContain('rodrigo@fincalacatalina.cr');
    expect(datos).toContain('+506 8888-4321');
    expect(datos).toContain('Cafetalero');

    expect(titulosSecciones()).toEqual(['Información de la cuenta']);
    expect(pagina.querySelector('[role="switch"]')).toBeNull();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
  });

  it('editar muestra todo en una sola página con los datos cargados', () => {
    clic('Editar perfil');

    expect(titulo()).toBe('Editar perfil');
    expect(pagina.textContent).toContain(
      'Actualizá tu foto de portada, tu información y tus preferencias.',
    );
    expect(pagina.textContent).not.toContain('de 2)');
    expect(() => boton('Siguiente')).toThrow();

    expect(campo('#nombre-perfil').value).toBe(PERFIL_EJEMPLO.nombreCompleto);
    expect(campo('#correo-perfil').value).toBe(PERFIL_EJEMPLO.correo);
    expect(campo('#telefono-perfil').value).toBe(PERFIL_EJEMPLO.telefono);
    expect(campo('#ubicacion-perfil').value).toBe(PERFIL_EJEMPLO.ubicacion);
    expect(campo<HTMLTextAreaElement>('#biografia-perfil').value).toBe(PERFIL_EJEMPLO.biografia);

    expect(titulosSecciones()).toEqual([
      'Redes sociales',
      'Seguridad',
      'Preferencias',
      'Zona de peligro',
    ]);
    expect(boton('Guardar cambios')).toBeTruthy();
  });

  it('"Guardar cambios" guarda y vuelve a la vista con el dato editado', () => {
    const actualizar = spyOn(perfilService, 'actualizar').and.callThrough();

    clic('Editar perfil');
    escribir('#nombre-perfil', 'Rodrigo Alvarado');
    clic('Guardar cambios');

    expect(actualizar).toHaveBeenCalled();
    expect(titulo()).toBe('Mi perfil');
    expect(campo('.identidad h2').textContent!.trim()).toBe('Rodrigo Alvarado');
  });

  it('Cancelar y Volver descartan los cambios', () => {
    const actualizar = spyOn(perfilService, 'actualizar').and.callThrough();

    clic('Editar perfil');
    escribir('#nombre-perfil', 'Otro nombre');
    clic('Cancelar');
    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.nombreCompleto);

    clic('Editar perfil');
    expect(campo('#nombre-perfil').value).toBe(PERFIL_EJEMPLO.nombreCompleto);
    escribir('#ubicacion-perfil', 'Dota, Costa Rica');
    clic('Quitar Instagram');
    clic('← Volver');

    expect(titulo()).toBe('Mi perfil');
    expect(pagina.textContent).toContain(PERFIL_EJEMPLO.ubicacion);
    expect([...pagina.querySelectorAll('.chips a')].length).toBe(2);
    expect(actualizar).not.toHaveBeenCalled();
  });

  const invalidos: [string, string, string][] = [
    ['#nombre-perfil', '', 'Poné tu nombre completo.'],
    ['#nombre-perfil', '    ', 'Poné tu nombre completo.'],
    ['#correo-perfil', 'rodrigo@finca', 'Ingresá un correo válido.'],
    ['#telefono-perfil', '8888-432', 'Ingresá un teléfono de 8 dígitos.'],
    ['#ubicacion-perfil', '', 'Poné tu ubicación.'],
  ];

  invalidos.forEach(([selector, valor, mensaje]) => {
    it(`no guarda con ${selector} = "${valor}" y lleva al campo con error`, async () => {
      const actualizar = spyOn(perfilService, 'actualizar').and.callThrough();
      const desplazar = spyOn(HTMLElement.prototype, 'scrollIntoView');

      clic('Editar perfil');
      escribir(selector, valor);
      clic('Guardar cambios');
      await fixture.whenStable();

      expect(actualizar).not.toHaveBeenCalled();
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
    const actualizar = spyOn(perfilService, 'actualizar').and.callThrough();
    spyOn(HTMLElement.prototype, 'scrollIntoView');

    clic('Editar perfil');
    clic('+ Agregar red social');
    clic('Sitio web');
    clic('Guardar cambios');
    await fixture.whenStable();

    expect(actualizar).not.toHaveBeenCalled();
    expect(campo('#error-red-sitio').textContent).toContain('Completá el enlace o quitá esta red.');
    expect(campo('#red-sitio').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(campo('#red-sitio'));

    escribir('#red-sitio', 'lacatalina');
    clic('Guardar cambios');
    expect(actualizar).not.toHaveBeenCalled();
    expect(campo('#error-red-sitio').textContent).toContain('Ingresá un enlace válido');
  });

  it('valida la contraseña aparte y muestra error o éxito', () => {
    const actualizar = spyOn(perfilService, 'actualizar').and.callThrough();
    clic('Editar perfil');

    const casos: [string, string, string][] = [
      ['', '', 'Completá la contraseña actual y la nueva.'],
      ['actual123', '', 'Completá la contraseña actual y la nueva.'],
      ['actual123', 'corta', 'La nueva contraseña debe tener al menos 8 caracteres.'],
      ['actual123', 'actual123', 'La nueva contraseña tiene que ser distinta a la actual.'],
    ];
    for (const [actual, nueva, mensaje] of casos) {
      escribir('#contrasena-actual', actual);
      escribir('#contrasena-nueva', nueva);
      clic('Actualizar contraseña');
      expect(campo('.mensaje').textContent!.trim()).withContext(nueva).toBe(mensaje);
      expect(campo('.mensaje').classList).toContain('mensaje--error');
    }

    escribir('#contrasena-actual', 'actual123');
    escribir('#contrasena-nueva', 'nueva12345');
    clic('Actualizar contraseña');
    expect(campo('.mensaje').classList).toContain('mensaje--exito');
    expect(campo('#contrasena-actual').value).toBe('');
    expect(campo('#contrasena-nueva').value).toBe('');
    expect(actualizar).not.toHaveBeenCalled();
    expect(titulo()).toBe('Editar perfil');
  });

  it('el switch de apariencia cambia el tema global y el data-theme del host', () => {
    const temas = TestBed.inject(TemaService);
    clic('Editar perfil');
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

  it('eliminar cuenta: cancelar cierra el modal y confirmar elimina y navega al inicio', async () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(perfilService, 'eliminarCuenta').and.callThrough();

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
    expect(navegar).toHaveBeenCalledWith('/');
    expect(await firstValueFrom(perfilService.obtener())).toBeNull();
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
