import {
  ActualizarTuesteRequestApi,
  FichaCodigoApi,
  LoteCompradoApi,
  LotesCompradosResponseApi,
  NuevoTueste,
  RegistrarTuesteRequestApi,
  TuesteApi,
} from '../models/tueste.model';
import {
  codigoTrazabilidadDesdeEstado,
  cuerpoActualizarTueste,
  cuerpoRegistrarTueste,
  loteCompradoDesdeApi,
  loteCompradoDesdeFicha,
  lotesCompradosDesdeApi,
  nivelTuesteDesdeApi,
  nivelTuesteHaciaApi,
  tuesteDesdeApi,
} from './tueste.mapper';

describe('tueste.mapper', () => {
  it('mapea nivel UI ↔ API', () => {
    expect(nivelTuesteHaciaApi('Claro')).toBe('CLARO');
    expect(nivelTuesteHaciaApi('Medio')).toBe('MEDIO');
    expect(nivelTuesteHaciaApi('Oscuro')).toBe('OSCURO');

    expect(nivelTuesteDesdeApi('CLARO')).toBe('Claro');
    expect(nivelTuesteDesdeApi('MEDIO')).toBe('Medio');
    expect(nivelTuesteDesdeApi('OSCURO')).toBe('Oscuro');
  });

  it('expone codigoTrazabilidad solo cuando el estado es ACTIVO', () => {
    expect(codigoTrazabilidadDesdeEstado('CRH-2026-0101', 'ACTIVO')).toBe('CRH-2026-0101');
    expect(codigoTrazabilidadDesdeEstado('CRH-2026-0102', 'PENDIENTE')).toBeNull();
  });

  it('mapea LoteCompradoApi a LoteComprado (codigo → codigoLote, proceso null)', () => {
    const api: LoteCompradoApi = {
      id: 'l-1',
      codigo: 'CRH-2026-0101',
      finca: 'La Catalina',
      variedad: 'Caturra',
      kg: 60,
      fechaCompra: '2026-10-06',
      estado: 'ACTIVO',
    };

    expect(loteCompradoDesdeApi(api)).toEqual({
      id: 'l-1',
      codigoLote: 'CRH-2026-0101',
      finca: 'La Catalina',
      variedad: 'Caturra',
      proceso: null,
      kg: 60,
      fechaCompra: '2026-10-06',
      codigoTrazabilidad: 'CRH-2026-0101',
    });

    expect(loteCompradoDesdeApi({ ...api, estado: 'PENDIENTE' }).codigoTrazabilidad).toBeNull();
  });

  it('mapea LotesCompradosResponseApi con indicadores de UI', () => {
    const api: LotesCompradosResponseApi = {
      indicadores: { lotesComprados: 2, kgComprados: 100.5, lotesConCodigo: 1 },
      lotes: [
        {
          id: 'l-1',
          codigo: 'CRH-2026-0001',
          finca: 'Finca El Tucán',
          variedad: 'Caturra',
          kg: 60,
          fechaCompra: '2026-03-01',
          estado: 'ACTIVO',
        },
        {
          id: 'l-2',
          codigo: 'CRH-2026-0002',
          finca: 'Finca El Tucán',
          variedad: 'Caturra',
          kg: 40.5,
          fechaCompra: '2026-03-02',
          estado: 'PENDIENTE',
        },
      ],
    };

    expect(lotesCompradosDesdeApi(api)).toEqual({
      indicadores: { lotes: 2, kg: 100.5, conCodigo: 1 },
      lotes: [
        {
          id: 'l-1',
          codigoLote: 'CRH-2026-0001',
          finca: 'Finca El Tucán',
          variedad: 'Caturra',
          proceso: null,
          kg: 60,
          fechaCompra: '2026-03-01',
          codigoTrazabilidad: 'CRH-2026-0001',
        },
        {
          id: 'l-2',
          codigoLote: 'CRH-2026-0002',
          finca: 'Finca El Tucán',
          variedad: 'Caturra',
          proceso: null,
          kg: 40.5,
          fechaCompra: '2026-03-02',
          codigoTrazabilidad: null,
        },
      ],
    });
  });

  it('mapea FichaCodigoApi a LoteComprado conservando fechaCompra y proceso base', () => {
    const ficha: FichaCodigoApi = {
      id: 'l-1',
      codigo: 'CRH-2026-0101',
      finca: 'La Catalina',
      variedad: 'Caturra',
      kg: 60,
      tostador: 'Mario Brenes',
      estado: 'ACTIVO',
      activadoEn: '2026-03-15T12:00:00Z',
    };

    expect(loteCompradoDesdeFicha(ficha, { fechaCompra: '2026-10-06', proceso: 'Honey' })).toEqual({
      id: 'l-1',
      codigoLote: 'CRH-2026-0101',
      finca: 'La Catalina',
      variedad: 'Caturra',
      proceso: 'Honey',
      kg: 60,
      fechaCompra: '2026-10-06',
      codigoTrazabilidad: 'CRH-2026-0101',
    });
  });

  it('mapea TuesteApi a Tueste (fechaTueste → fecha, codigoLote → codigoTrazabilidad)', () => {
    const api: TuesteApi = {
      id: 't-1',
      loteId: 'l-1',
      codigoLote: 'CRH-2026-0101',
      nivel: 'MEDIO',
      pesoVerdeKg: 12,
      pesoTostadoKg: 10.2,
      merma: 15,
      fechaTueste: '2026-10-21',
      notas: 'Primer crack',
    };

    expect(tuesteDesdeApi(api)).toEqual({
      id: 't-1',
      loteId: 'l-1',
      nivel: 'Medio',
      pesoVerdeKg: 12,
      pesoTostadoKg: 10.2,
      fecha: '2026-10-21',
      notas: 'Primer crack',
      codigoTrazabilidad: 'CRH-2026-0101',
    });

    const sinCodigo: TuesteApi = { ...api, codigoLote: undefined };
    expect(tuesteDesdeApi(sinCodigo, 'CRH-2026-0102').codigoTrazabilidad).toBe('CRH-2026-0102');
  });

  it('arma el body de registro y actualización con nivel y fechaTueste del API', () => {
    const nuevo: NuevoTueste = {
      loteId: 'l-1',
      nivel: 'Oscuro',
      pesoVerdeKg: 15,
      pesoTostadoKg: 12.4,
      fecha: '2026-10-30',
      notas: null,
    };

    const registro: RegistrarTuesteRequestApi = cuerpoRegistrarTueste(nuevo);
    expect(registro).toEqual({
      loteId: 'l-1',
      nivel: 'OSCURO',
      pesoVerdeKg: 15,
      pesoTostadoKg: 12.4,
      fechaTueste: '2026-10-30',
      notas: null,
    });

    const { loteId, ...cambios } = nuevo;
    void loteId;
    const actualizacion: ActualizarTuesteRequestApi = cuerpoActualizarTueste(cambios);
    expect(actualizacion).toEqual({
      nivel: 'OSCURO',
      pesoVerdeKg: 15,
      pesoTostadoKg: 12.4,
      fechaTueste: '2026-10-30',
      notas: null,
    });
  });
});
