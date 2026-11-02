import { Injectable, computed, signal } from '@angular/core';

import {
  COSECHAS_DASHBOARD,
  FINCAS_DASHBOARD,
  PERFIL_CAFETALERO_SIDEBAR,
  SOLICITUDES_DASHBOARD,
} from '../mocks/dashboard-cafetalero.mock';
import {
  CosechaReciente,
  FincaResumen,
  IndicadoresDashboard,
  PerfilCafetaleroSidebar,
  SolicitudTostador,
  TemaDashboard,
} from '../models/dashboard-cafetalero.model';

function clonarCosechas(cosechas: CosechaReciente[]): CosechaReciente[] {
  return cosechas.map((c) => ({ ...c }));
}

function clonarSolicitudes(solicitudes: SolicitudTostador[]): SolicitudTostador[] {
  return solicitudes.map((s) => ({ ...s }));
}

function calcularIndicadores(
  fincas: FincaResumen[],
  cosechas: CosechaReciente[],
  solicitudes: SolicitudTostador[],
): IndicadoresDashboard {
  const kgDisponibles = cosechas.reduce((total, c) => total + (c.kgDisponibles ?? 0), 0);
  const solicitudesPendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;

  return {
    fincasRegistradas: fincas.length,
    cosechasActivas: cosechas.length,
    kgDisponibles,
    solicitudesPendientes,
  };
}

// Simula el backend en memoria; Aprobar/Rechazar mutan el estado local.
@Injectable({ providedIn: 'root' })
export class DashboardCafetaleroService {
  private readonly fincas = signal<FincaResumen[]>(FINCAS_DASHBOARD.map((f) => ({ ...f })));
  private readonly cosechas = signal<CosechaReciente[]>(clonarCosechas(COSECHAS_DASHBOARD));
  private readonly solicitudes = signal<SolicitudTostador[]>(
    clonarSolicitudes(SOLICITUDES_DASHBOARD),
  );
  private readonly temaActual = signal<TemaDashboard>('oscuro');

  readonly perfilSidebar: PerfilCafetaleroSidebar = PERFIL_CAFETALERO_SIDEBAR;

  readonly fincasResumen = this.fincas.asReadonly();
  readonly cosechasRecientes = this.cosechas.asReadonly();
  readonly solicitudesPendientes = computed(() =>
    this.solicitudes().filter((s) => s.estado === 'pendiente'),
  );
  readonly indicadores = computed(() =>
    calcularIndicadores(this.fincas(), this.cosechas(), this.solicitudes()),
  );
  readonly tema = this.temaActual.asReadonly();

  alternarTema(): void {
    this.temaActual.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }

  establecerTema(tema: TemaDashboard): void {
    this.temaActual.set(tema);
  }

  aprobarSolicitud(id: string): void {
    const solicitud = this.solicitudes().find((s) => s.id === id);
    if (!solicitud || solicitud.estado !== 'pendiente') {
      return;
    }

    this.cosechas.update((lista) =>
      lista.map((cosecha) => {
        if (cosecha.id !== solicitud.cosechaId || cosecha.kgDisponibles == null) {
          return cosecha;
        }
        return {
          ...cosecha,
          kgDisponibles: Math.max(0, cosecha.kgDisponibles - solicitud.kgSolicitados),
        };
      }),
    );

    this.solicitudes.update((lista) =>
      lista.map((s) => (s.id === id ? { ...s, estado: 'aprobada' } : s)),
    );
  }

  rechazarSolicitud(id: string): void {
    const solicitud = this.solicitudes().find((s) => s.id === id);
    if (!solicitud || solicitud.estado !== 'pendiente') {
      return;
    }

    this.solicitudes.update((lista) =>
      lista.map((s) => (s.id === id ? { ...s, estado: 'rechazada' } : s)),
    );
  }

  sincronizarCosechaReciente(cosecha: CosechaReciente): void {
    this.cosechas.update((lista) => {
      const indice = lista.findIndex((c) => c.id === cosecha.id);
      if (indice === -1) {
        return [{ ...cosecha }, ...lista];
      }
      const actualizada = [...lista];
      actualizada[indice] = { ...cosecha };
      return actualizada;
    });
  }

  eliminarCosechaReciente(id: string): void {
    this.cosechas.update((lista) => lista.filter((c) => c.id !== id));
  }
}
