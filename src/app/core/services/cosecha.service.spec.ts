import { TestBed } from '@angular/core/testing';

import { COSECHAS_INICIALES } from '../mocks/cosecha.mock';
import { NuevaCosecha } from '../models/cosecha.model';
import { CosechaService } from './cosecha.service';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';

function datosNueva(parcial: Partial<NuevaCosecha> = {}): NuevaCosecha {
  return {
    fincaId: 'finca-la-catalina',
    variedad: 'Bourbon',
    alturaMsnm: 1500,
    cantidadTotalKg: 80,
    fechaInicio: '2026-01-10',
    fechaFin: '2026-01-20',
    procesos: [
      { proceso: 'Honey', porcentaje: 60 },
      { proceso: 'Natural', porcentaje: 40 },
    ],
    pesoAntesKg: 80,
    pesoTrasSeleccionKg: 64,
    separoCaracolillo: false,
    pesoCaracolilloKg: null,
    puntajeSca: null,
    notasCatacion: null,
    ...parcial,
  };
}

describe('CosechaService', () => {
  let servicio: CosechaService;
  let dashboard: DashboardCafetaleroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(CosechaService);
    dashboard = TestBed.inject(DashboardCafetaleroService);
  });

  it('expone catálogos mock de fincas y procesos', () => {
    expect(servicio.fincas.length).toBeGreaterThanOrEqual(2);
    expect(servicio.procesosBeneficiado.map((p) => p.nombre)).toContain('Honey');
    expect(servicio.variedades).toContain('Caturra');
  });

  it('lista las cosechas iniciales alineadas con el dashboard', () => {
    expect(servicio.lista()).toHaveSize(COSECHAS_INICIALES.length);
    expect(servicio.obtener('cosecha-caturra-catalina')?.variedad).toBe('Caturra');
  });

  it('obtener devuelve una copia y undefined si no existe', () => {
    const original = servicio.obtener('cosecha-caturra-catalina')!;
    original.variedad = 'Mutada';
    expect(servicio.obtener('cosecha-caturra-catalina')?.variedad).toBe('Caturra');
    expect(servicio.obtener('no-existe')).toBeUndefined();
  });

  it('crea una cosecha y la refleja en cosechas recientes del dashboard', () => {
    const creada = servicio.crear(datosNueva());

    expect(creada.id).toBeTruthy();
    expect(servicio.lista()).toHaveSize(COSECHAS_INICIALES.length + 1);
    expect(servicio.obtener(creada.id)?.variedad).toBe('Bourbon');

    const reciente = dashboard.cosechasRecientes().find((c) => c.id === creada.id);
    expect(reciente).toEqual(
      jasmine.objectContaining({
        variedad: 'Bourbon',
        finca: 'La Catalina',
        proceso: 'Honey',
        kgDisponibles: 64,
        estado: 'Disponible',
      }),
    );
  });

  it('actualiza una cosecha existente y sincroniza el dashboard', () => {
    const id = 'cosecha-geisha-monte-alto';
    const actualizada = servicio.actualizar(
      id,
      datosNueva({
        fincaId: 'finca-monte-alto',
        variedad: 'Geisha',
        pesoTrasSeleccionKg: 45,
        procesos: [{ proceso: 'Lavado', porcentaje: 100 }],
      }),
    );

    expect(actualizada?.pesoTrasSeleccionKg).toBe(45);
    expect(servicio.obtener(id)?.pesoTrasSeleccionKg).toBe(45);

    const reciente = dashboard.cosechasRecientes().find((c) => c.id === id);
    expect(reciente?.kgDisponibles).toBe(45);
    expect(reciente?.proceso).toBe('Lavado');
  });

  it('actualizar retorna undefined si el id no existe', () => {
    expect(servicio.actualizar('fantasma', datosNueva())).toBeUndefined();
  });

  it('elimina una cosecha y la quita del dashboard', () => {
    const id = 'cosecha-catuai-catalina';
    expect(servicio.eliminar(id)).toBeTrue();
    expect(servicio.obtener(id)).toBeUndefined();
    expect(dashboard.cosechasRecientes().some((c) => c.id === id)).toBeFalse();
    expect(servicio.eliminar(id)).toBeFalse();
  });

  it('marca En beneficiado cuando el peso tras selección es 0', () => {
    const creada = servicio.crear(datosNueva({ pesoTrasSeleccionKg: 0 }));
    const reciente = dashboard.cosechasRecientes().find((c) => c.id === creada.id);
    expect(reciente?.estado).toBe('En beneficiado');
    expect(reciente?.kgDisponibles).toBeNull();
  });
});
