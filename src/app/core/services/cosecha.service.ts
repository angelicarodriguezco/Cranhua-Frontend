import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CATALOGO_PROCESOS_BENEFICIADO,
  COSECHAS_INICIALES,
  FINCAS_COSECHA,
  VARIEDADES_CAFE,
} from '../mocks/cosecha.mock';
import {
  Cosecha,
  FincaCosechaOpcion,
  NuevaCosecha,
  OpcionProcesoBeneficiado,
  ProcesoReparto,
} from '../models/cosecha.model';
import { CosechaReciente, EstadoCosecha } from '../models/dashboard-cafetalero.model';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';

function clonarProcesos(procesos: ProcesoReparto[]): ProcesoReparto[] {
  return procesos.map((p) => ({ ...p }));
}

function clonarCosecha(cosecha: Cosecha): Cosecha {
  return {
    ...cosecha,
    procesos: clonarProcesos(cosecha.procesos),
  };
}

function clonarCosechas(cosechas: Cosecha[]): Cosecha[] {
  return cosechas.map(clonarCosecha);
}

function procesoPrincipal(procesos: ProcesoReparto[]): string {
  if (procesos.length === 0) {
    return '';
  }
  return [...procesos].sort((a, b) => b.porcentaje - a.porcentaje)[0].proceso;
}

function nombreFinca(fincaId: string, fincas: readonly FincaCosechaOpcion[]): string {
  return fincas.find((f) => f.id === fincaId)?.nombre ?? fincaId;
}

function derivarEstado(pesoTrasSeleccionKg: number): {
  kgDisponibles: number | null;
  estado: EstadoCosecha;
} {
  const enBeneficiado = pesoTrasSeleccionKg <= 0;
  return {
    kgDisponibles: enBeneficiado ? null : pesoTrasSeleccionKg,
    estado: enBeneficiado ? 'En beneficiado' : 'Disponible',
  };
}

function completarCosecha(id: string, datos: NuevaCosecha): Cosecha {
  const proceso = datos.proceso?.trim() || procesoPrincipal(datos.procesos);
  const { kgDisponibles, estado } = derivarEstado(datos.pesoTrasSeleccionKg);
  const prefijo = datos.fincaId.replace(/^finca-/, '').replace(/^f-/, '').slice(0, 2).toUpperCase();

  return {
    ...datos,
    id,
    proceso,
    codigoLote: datos.codigoLote ?? `${prefijo || 'CO'}-${new Date().getFullYear()}-${id.slice(-3)}`,
    kgDisponibles: datos.kgDisponibles !== undefined ? datos.kgDisponibles : kgDisponibles,
    estado: datos.estado ?? estado,
    procesos: clonarProcesos(datos.procesos),
  };
}

function aCosechaReciente(
  cosecha: Cosecha,
  fincas: readonly FincaCosechaOpcion[],
): CosechaReciente {
  return {
    id: cosecha.id,
    variedad: cosecha.variedad,
    finca: nombreFinca(cosecha.fincaId, fincas),
    proceso: cosecha.proceso || procesoPrincipal(cosecha.procesos),
    kgDisponibles: cosecha.kgDisponibles,
    estado: cosecha.estado,
  };
}

@Injectable({ providedIn: 'root' })
export class CosechaService {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly cosechas = signal<Cosecha[]>(clonarCosechas(COSECHAS_INICIALES));
  private siguienteId = 1;

  readonly lista = this.cosechas.asReadonly();

  readonly fincas: readonly FincaCosechaOpcion[] = FINCAS_COSECHA;
  readonly procesosBeneficiado: readonly OpcionProcesoBeneficiado[] =
    CATALOGO_PROCESOS_BENEFICIADO;
  readonly variedades: readonly string[] = VARIEDADES_CAFE;

  /** Cosechas de una finca (detalle de finca). */
  deFinca(fincaId: string): Observable<Cosecha[]> {
    return of(this.cosechas().filter((c) => c.fincaId === fincaId).map(clonarCosecha));
  }

  obtener(id: string): Cosecha | undefined {
    const encontrada = this.cosechas().find((c) => c.id === id);
    return encontrada ? clonarCosecha(encontrada) : undefined;
  }

  crear(datos: NuevaCosecha): Cosecha {
    const cosecha = completarCosecha(`cosecha-${Date.now()}-${this.siguienteId++}`, datos);
    this.cosechas.update((lista) => [cosecha, ...lista]);
    this.dashboard.sincronizarCosechaReciente(aCosechaReciente(cosecha, this.fincas));
    return clonarCosecha(cosecha);
  }

  actualizar(id: string, datos: NuevaCosecha): Cosecha | undefined {
    if (!this.cosechas().some((c) => c.id === id)) {
      return undefined;
    }

    const previa = this.cosechas().find((c) => c.id === id);
    const cosecha = completarCosecha(id, {
      ...datos,
      codigoLote: datos.codigoLote ?? previa?.codigoLote,
    });
    this.cosechas.update((lista) => lista.map((c) => (c.id === id ? cosecha : c)));
    this.dashboard.sincronizarCosechaReciente(aCosechaReciente(cosecha, this.fincas));
    return clonarCosecha(cosecha);
  }

  eliminar(id: string): boolean {
    const existia = this.cosechas().some((c) => c.id === id);
    if (!existia) {
      return false;
    }

    this.cosechas.update((lista) => lista.filter((c) => c.id !== id));
    this.dashboard.eliminarCosechaReciente(id);
    return true;
  }
}
