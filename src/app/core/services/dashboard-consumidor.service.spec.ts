import { TestBed } from '@angular/core/testing';

import { PUNTOS_MAPA_CONSUMIDOR } from '../mocks/dashboard-consumidor.mock';
import { DashboardConsumidorService } from './dashboard-consumidor.service';

describe('DashboardConsumidorService', () => {
  let servicio: DashboardConsumidorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(DashboardConsumidorService);
  });

  it('expone al menos 4 pines de finca, tostador y cafetería', () => {
    const puntos = servicio.puntos();
    expect(puntos.length).toBeGreaterThanOrEqual(4);
    expect(puntos).toEqual(PUNTOS_MAPA_CONSUMIDOR);

    const tipos = new Set(puntos.map((p) => p.tipo));
    expect(tipos).toEqual(new Set(['finca', 'tostador', 'cafeteria']));

    expect(puntos.map((p) => p.nombre)).toEqual(
      jasmine.arrayContaining([
        'Finca La Catalina',
        'Finca El Roble',
        'Tostaduría Volcán',
        'Café Brumas',
      ]),
    );
  });

  it('resuelve el código válido de ejemplo a finca y cosecha', () => {
    expect(servicio.buscarCodigo('CRH-2026-0103')).toEqual({
      codigo: 'CRH-2026-0103',
      fincaId: 'finca-el-roble',
      cosechaId: 'cosecha-catuai-el-roble',
    });
    expect(servicio.buscarCodigo('  crh-2026-0103  ')).toEqual({
      codigo: 'CRH-2026-0103',
      fincaId: 'finca-el-roble',
      cosechaId: 'cosecha-catuai-el-roble',
    });
  });

  it('devuelve null para códigos vacíos o desconocidos', () => {
    expect(servicio.buscarCodigo('')).toBeNull();
    expect(servicio.buscarCodigo('   ')).toBeNull();
    expect(servicio.buscarCodigo('CRH-9999-0000')).toBeNull();
  });

  it('alterna el tema entre oscuro y claro', () => {
    expect(servicio.tema()).toBe('oscuro');
    servicio.establecerTema('claro');
    expect(servicio.tema()).toBe('claro');
    servicio.establecerTema('oscuro');
    expect(servicio.tema()).toBe('oscuro');
  });
});
