import {
  CosechaHistorialApi,
  HistorialCafetaleroResponseApi,
  IndicadoresHistorialApi,
  LoteVendidoApi,
  Pagina,
} from '../models/historial-cafetalero.model';
import {
  cosechaHistorialDesdeApi,
  historialCafetaleroDesdeApi,
  indicadoresHistorialDesdeApi,
  loteVendidoDesdeApi,
  paginaDesdeApi,
} from './historial-cafetalero.mapper';

describe('historial-cafetalero.mapper', () => {
  it('convierte produccionTotalKg BigDecimal a número', () => {
    const api: IndicadoresHistorialApi = {
      cosechasRegistradas: 2,
      produccionTotalKg: '210.75' as unknown as number,
      lotesVendidos: 1,
    };

    expect(indicadoresHistorialDesdeApi(api)).toEqual({
      cosechasRegistradas: 2,
      produccionTotalKg: 210.75,
      lotesVendidos: 1,
    });
  });

  it('mapea CosechaHistorialApi con estado UI', () => {
    const api: CosechaHistorialApi = {
      id: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'La Catalina',
      variedad: 'Catuaí',
      fechaInicio: '2025-12-01',
      fechaFin: '2025-12-10',
      cantidadCosechadaKg: '90' as unknown as number,
      estado: 'BORRADOR',
    };

    expect(cosechaHistorialDesdeApi(api)).toEqual({
      id: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'La Catalina',
      variedad: 'Catuaí',
      fechaInicio: '2025-12-01',
      fechaFin: '2025-12-10',
      cantidadCosechadaKg: 90,
      estado: 'Borrador',
    });
  });

  it('mapea LoteVendidoApi con kg, precioKg y total numéricos', () => {
    const api: LoteVendidoApi = {
      id: 'lote-1',
      codigo: 'CRN-LC-2511-01',
      cosechaId: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'La Catalina',
      variedad: 'Caturra',
      comprador: 'Café Altamira',
      kg: '50' as unknown as number,
      precioKg: '4200' as unknown as number,
      total: '210000' as unknown as number,
      vendidoEn: '2025-11-20',
    };

    expect(loteVendidoDesdeApi(api)).toEqual({
      id: 'lote-1',
      codigo: 'CRN-LC-2511-01',
      cosechaId: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'La Catalina',
      variedad: 'Caturra',
      comprador: 'Café Altamira',
      kg: 50,
      precioKg: 4200,
      total: 210000,
      vendidoEn: '2025-11-20',
    });
  });

  it('mapea Pagina aplicando el mapper de ítems', () => {
    const api: Pagina<{ valor: string }> = {
      contenido: [{ valor: 'a' }, { valor: 'b' }],
      pagina: 0,
      tamano: 50,
      totalElementos: 2,
      totalPaginas: 1,
    };

    expect(paginaDesdeApi(api, (item) => item.valor.toUpperCase())).toEqual({
      contenido: ['A', 'B'],
      pagina: 0,
      tamano: 50,
      totalElementos: 2,
      totalPaginas: 1,
    });
  });

  it('mapea HistorialCafetaleroResponseApi completo', () => {
    const cosecha: CosechaHistorialApi = {
      id: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      fechaInicio: '2025-10-20',
      fechaFin: '2025-11-05',
      cantidadCosechadaKg: 70,
      estado: 'AGOTADA',
    };
    const lote: LoteVendidoApi = {
      id: 'lote-1',
      codigo: 'CRN-MA-2510-02',
      cosechaId: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      comprador: 'Tostaduría Volcán',
      kg: 30,
      precioKg: 8500,
      total: 255000,
      vendidoEn: '2025-10-28',
    };
    const api: HistorialCafetaleroResponseApi = {
      indicadores: {
        cosechasRegistradas: 1,
        produccionTotalKg: 70,
        lotesVendidos: 1,
      },
      cosechas: {
        contenido: [cosecha],
        pagina: 0,
        tamano: 50,
        totalElementos: 1,
        totalPaginas: 1,
      },
      lotesVendidos: {
        contenido: [lote],
        pagina: 0,
        tamano: 50,
        totalElementos: 1,
        totalPaginas: 1,
      },
    };

    expect(historialCafetaleroDesdeApi(api)).toEqual({
      indicadores: indicadoresHistorialDesdeApi(api.indicadores),
      cosechas: [cosechaHistorialDesdeApi(cosecha)],
      lotesVendidos: [loteVendidoDesdeApi(lote)],
    });
  });
});
