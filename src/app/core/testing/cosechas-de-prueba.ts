import { Cosecha, CosechaResponseApi } from '../models/cosecha.model';
import { cosechaDesdeApi } from '../utils/cosecha-desde-api';

export function cosechaApi(cambios: Partial<CosechaResponseApi> = {}): CosechaResponseApi {
  return {
    id: 'c-1',
    fincaId: 'f-1',
    variedad: 'Geisha',
    alturaMsnm: 1650,
    fechaInicio: '2026-01-10',
    fechaFin: '2026-03-15',
    procesos: [
      { proceso: 'Natural', porcentaje: 30 },
      { proceso: 'Lavado', porcentaje: 70 },
    ],
    cantidadCosechadaKg: 1000,
    pesoTrasBeneficiadoKg: 800,
    pesoTrasSeleccionKg: 720,
    caracolilloKg: 40,
    mermaBeneficiadoPorcentaje: 20,
    mermaSeleccionPorcentaje: 10,
    notasSabor: 'Jazmín y durazno',
    puntajeSca: 88.25,
    precioKg: 4500,
    kgDisponibles: 720,
    estado: 'BORRADOR',
    codigoLote: null,
    fincaNombre: 'Finca La Catalina',
    ...cambios,
  };
}

export function cosechaDePrueba(cambios: Partial<CosechaResponseApi> = {}): Cosecha {
  return cosechaDesdeApi(cosechaApi(cambios));
}
