import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CAFETERIA_ACTUAL, CAFETERIA_EJEMPLO } from '../mocks/cafeteria.mock';
import { CafeteriaService } from './cafeteria.service';

describe('CafeteriaService', () => {
  let servicio: CafeteriaService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    servicio = TestBed.inject(CafeteriaService);
  });

  it('ubica una cafetería en Chepe centro', () => {
    expect(servicio.cantonDe({ lat: 9.9335, lng: -84.0775 })?.nombre).toBe('San José');
  });

  it('no asigna cantón a un punto lejos de todos', () => {
    expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
  });

  it('arranca con la cafetería de ejemplo sembrada', async () => {
    const actual = await firstValueFrom(servicio.obtenerActual());
    expect(actual?.id).toBe(CAFETERIA_EJEMPLO.id);
    expect(actual?.nombre).toBe('Café Brumas');
    expect(actual?.contacto).toBe('Andrés Solano');
    expect(actual?.telefono).toBe('+506 8899-4410');
    expect(actual?.correo).toBe('hola@cafebrumas.cr');
    expect(actual?.canton?.nombre).toBe('Escazú');
    expect(actual?.propietarioId).toBe(CAFETERIA_ACTUAL.id);
    expect(actual?.estilos).toEqual(['Claro', 'Medio']);
    expect(actual?.portadaUrl).toBeNull();
  });

  it('obtenerPorPropietario devuelve la cafetería del dueño', async () => {
    const propia = await firstValueFrom(servicio.obtenerPorPropietario(CAFETERIA_ACTUAL.id));
    expect(propia?.id).toBe(CAFETERIA_EJEMPLO.id);

    const ajena = await firstValueFrom(servicio.obtenerPorPropietario('u-desconocido'));
    expect(ajena).toBeUndefined();
  });

  it('actualizar reemplaza la entidad completa incluida la portada', async () => {
    const actualizada = {
      ...CAFETERIA_EJEMPLO,
      nombre: 'Café Brumas Escazú',
      estilos: ['Oscuro'] as const,
      portadaUrl: 'blob:mock-portada',
    };
    const guardada = await firstValueFrom(servicio.actualizar({ ...actualizada, estilos: [...actualizada.estilos] }));
    expect(guardada.nombre).toBe('Café Brumas Escazú');
    expect(guardada.portadaUrl).toBe('blob:mock-portada');

    const actual = await firstValueFrom(servicio.obtenerActual());
    expect(actual?.nombre).toBe('Café Brumas Escazú');
    expect(actual?.portadaUrl).toBe('blob:mock-portada');
  });

  it('eliminar quita la cafetería sembrada y responde false si no existe', async () => {
    expect(await firstValueFrom(servicio.eliminar(CAFETERIA_EJEMPLO.id))).toBe(true);
    expect(await firstValueFrom(servicio.obtenerActual())).toBeUndefined();
    expect(await firstValueFrom(servicio.eliminar(CAFETERIA_EJEMPLO.id))).toBe(false);
  });
});
