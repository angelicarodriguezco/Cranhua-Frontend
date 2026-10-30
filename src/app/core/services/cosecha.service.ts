import { Injectable, inject, signal } from '@angular/core';

import {
  COSECHAS_INICIALES,
  FINCAS_COSECHA,
  PROCESOS_BENEFICIADO,
  VARIEDADES_CAFE,
} from '../mocks/cosecha.mock';
import {
  Cosecha,
  FincaCosechaOpcion,
  NuevaCosecha,
  ProcesoBeneficiado,
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

function aCosechaReciente(
  cosecha: Cosecha,
  fincas: readonly FincaCosechaOpcion[],
): CosechaReciente {
  const enBeneficiado = cosecha.pesoTrasSeleccionKg <= 0;
  const estado: EstadoCosecha = enBeneficiado ? 'En beneficiado' : 'Disponible';

  return {
    id: cosecha.id,
    variedad: cosecha.variedad,
    finca: nombreFinca(cosecha.fincaId, fincas),
    proceso: procesoPrincipal(cosecha.procesos),
    kgDisponibles: enBeneficiado ? null : cosecha.pesoTrasSeleccionKg,
    estado,
  };
}

@Injectable({ providedIn: 'root' })
export class CosechaService {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly cosechas = signal<Cosecha[]>(clonarCosechas(COSECHAS_INICIALES));
  private siguienteId = 1;

  readonly lista = this.cosechas.asReadonly();

  readonly fincas: readonly FincaCosechaOpcion[] = FINCAS_COSECHA;
  readonly procesosBeneficiado: readonly ProcesoBeneficiado[] = PROCESOS_BENEFICIADO;
  readonly variedades: readonly string[] = VARIEDADES_CAFE;

  obtener(id: string): Cosecha | undefined {
    const encontrada = this.cosechas().find((c) => c.id === id);
    return encontrada ? clonarCosecha(encontrada) : undefined;
  }

  crear(datos: NuevaCosecha): Cosecha {
    const cosecha = clonarCosecha({
      ...datos,
      id: `cosecha-${Date.now()}-${this.siguienteId++}`,
    });

    this.cosechas.update((lista) => [cosecha, ...lista]);
    this.dashboard.sincronizarCosechaReciente(aCosechaReciente(cosecha, this.fincas));
    return clonarCosecha(cosecha);
  }

  actualizar(id: string, datos: NuevaCosecha): Cosecha | undefined {
    if (!this.cosechas().some((c) => c.id === id)) {
      return undefined;
    }

    const cosecha = clonarCosecha({ ...datos, id });
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
