import { TestBed } from '@angular/core/testing';

import { COSECHAS_HISTORIAL, LOTES_VENDIDOS } from '../mocks/historial-cafetalero.mock';
import { HistorialCafetaleroService } from './historial-cafetalero.service';

describe('HistorialCafetaleroService', () => {
  let servicio: HistorialCafetaleroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(HistorialCafetaleroService);
  });

  it('calcula los indicadores a partir de los datos de ejemplo', () => {
    expect(servicio.indicadores()).toEqual({
      cosechasRegistradas: 7,
      produccionTotalKg: 675,
      lotesVendidos: 4,
    });
  });

  it('ordena cosechas y lotes de la más reciente a la más antigua', () => {
    const fechasCosecha = servicio.cosechas().map((c) => c.fecha);
    expect(fechasCosecha).toEqual([...fechasCosecha].sort().reverse());

    const fechasVenta = servicio.lotesVendidos().map((l) => l.fechaVenta);
    expect(fechasVenta).toEqual([...fechasVenta].sort().reverse());
  });

  it('cada lote vendido pertenece a una cosecha vendida sin exceder sus kilos', () => {
    for (const cosecha of COSECHAS_HISTORIAL.filter((c) => c.estado === 'Vendida')) {
      const vendidos = LOTES_VENDIDOS.filter((l) => l.cosechaId === cosecha.id).reduce(
        (total, l) => total + l.kilos,
        0,
      );
      expect(vendidos).withContext(cosecha.id).toBeLessThanOrEqual(cosecha.kilos);
    }

    for (const lote of LOTES_VENDIDOS) {
      const cosecha = COSECHAS_HISTORIAL.find((c) => c.id === lote.cosechaId);
      expect(cosecha?.estado).withContext(lote.codigo).toBe('Vendida');
    }
  });
});
