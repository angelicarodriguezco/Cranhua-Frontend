import { estadoCosechaDesdeApi } from '../mappers/dashboard-cafetalero.mapper';
import { Cosecha, CosechaResponseApi, ProcesoReparto } from '../models/cosecha.model';

// Campos del backend que se llaman distinto en el formulario
const CAMPOS_FORMULARIO: Record<string, string> = {
  cantidadCosechadaKg: 'cantidadTotalKg',
  pesoTrasBeneficiadoKg: 'pesoAntesKg',
  caracolilloKg: 'pesoCaracolilloKg',
  notasSabor: 'notasCatacion',
};

export function procesoPrincipal(procesos: ProcesoReparto[]): string {
  return [...procesos].sort((a, b) => b.porcentaje - a.porcentaje)[0]?.proceso ?? '';
}

export function cosechaDesdeApi(api: CosechaResponseApi): Cosecha {
  return {
    id: api.id,
    fincaId: api.fincaId,
    fincaNombre: api.fincaNombre ?? null,
    variedad: api.variedad,
    alturaMsnm: api.alturaMsnm,
    cantidadTotalKg: api.cantidadCosechadaKg,
    fechaInicio: api.fechaInicio,
    fechaFin: api.fechaFin,
    procesos: api.procesos,
    pesoAntesKg: api.pesoTrasBeneficiadoKg,
    pesoTrasSeleccionKg: api.pesoTrasSeleccionKg,
    separoCaracolillo: api.caracolilloKg !== null ? true : null,
    pesoCaracolilloKg: api.caracolilloKg,
    mermaSeleccionPorcentaje: api.mermaSeleccionPorcentaje,
    puntajeSca: api.puntajeSca,
    notasCatacion: api.notasSabor,
    precioKg: api.precioKg,
    proceso: procesoPrincipal(api.procesos),
    codigoLote: api.codigoLote,
    kgDisponibles: api.kgDisponibles,
    estado: estadoCosechaDesdeApi(api.estado),
  };
}

// "procesos[0].porcentaje" también cae en el control procesos
export function erroresEnFormulario(errores: Record<string, string>): Record<string, string> {
  const enFormulario: Record<string, string> = {};
  for (const [campo, mensaje] of Object.entries(errores)) {
    const base = campo.replace(/[[.].*$/, '');
    enFormulario[CAMPOS_FORMULARIO[base] ?? base] ??= mensaje;
  }
  return enFormulario;
}
