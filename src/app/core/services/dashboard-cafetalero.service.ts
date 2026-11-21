import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  COSECHAS_DASHBOARD,
  FINCAS_DASHBOARD,
  PERFIL_CAFETALERO_SIDEBAR,
} from '../mocks/dashboard-cafetalero.mock';
import {
  CosechaReciente,
  FincaResumen,
  IndicadoresDashboard,
  PerfilCafetaleroSidebar,
  RespuestaSolicitud,
  SolicitudRecibidaApi,
  SolicitudTostador,
  TemaDashboard,
} from '../models/dashboard-cafetalero.model';
import { TemaService } from './tema.service';

const opcionesCredenciales = { withCredentials: true as const };

function clonarCosechas(cosechas: CosechaReciente[]): CosechaReciente[] {
  return cosechas.map((c) => ({ ...c }));
}

function solicitudDesdeApi(api: SolicitudRecibidaApi): SolicitudTostador {
  return {
    id: api.id,
    nombreTostador: api.nombreTostador,
    kgSolicitados: Number(api.cantidadKg),
    variedad: api.variedad,
    finca: api.finca,
    cosechaId: api.cosechaId,
  };
}

function calcularIndicadores(
  fincas: FincaResumen[],
  cosechas: CosechaReciente[],
  solicitudesPendientes: number,
): IndicadoresDashboard {
  const kgDisponibles = cosechas.reduce((total, c) => total + (c.kgDisponibles ?? 0), 0);

  return {
    fincasRegistradas: fincas.length,
    cosechasActivas: cosechas.length,
    kgDisponibles,
    solicitudesPendientes,
  };
}

// Fincas y cosechas siguen en memoria; las solicitudes vienen del API
@Injectable({ providedIn: 'root' })
export class DashboardCafetaleroService {
  private readonly http = inject(HttpClient);
  private readonly fincas = signal<FincaResumen[]>(FINCAS_DASHBOARD.map((f) => ({ ...f })));
  private readonly cosechas = signal<CosechaReciente[]>(clonarCosechas(COSECHAS_DASHBOARD));
  private readonly solicitudes = signal<SolicitudTostador[]>([]);
  private readonly temas = inject(TemaService);

  private get baseSolicitudes(): string {
    return `${environment.apiUrl}/api/solicitudes`;
  }

  readonly perfilSidebar: PerfilCafetaleroSidebar = PERFIL_CAFETALERO_SIDEBAR;

  readonly fincasResumen = this.fincas.asReadonly();
  readonly cosechasRecientes = this.cosechas.asReadonly();
  readonly solicitudesPendientes = this.solicitudes.asReadonly();
  readonly indicadores = computed(() =>
    calcularIndicadores(this.fincas(), this.cosechas(), this.solicitudes().length),
  );
  readonly tema = this.temas.tema;

  alternarTema(): void {
    this.temas.alternarTema();
  }

  establecerTema(tema: TemaDashboard): void {
    this.temas.establecerTema(tema);
  }

  cargarSolicitudesPendientes(): Observable<SolicitudTostador[]> {
    return this.http
      .get<SolicitudRecibidaApi[]>(`${this.baseSolicitudes}/recibidas`, {
        ...opcionesCredenciales,
        params: { estado: 'PENDIENTE' },
      })
      .pipe(
        map((lista) => lista.map(solicitudDesdeApi)),
        tap((lista) => this.solicitudes.set(lista)),
      );
  }

  aprobarSolicitud(id: string): Observable<void> {
    return this.responder(id, 'APROBADA');
  }

  rechazarSolicitud(id: string): Observable<void> {
    return this.responder(id, 'RECHAZADA');
  }

  private responder(id: string, estado: RespuestaSolicitud): Observable<void> {
    return this.http.patch(`${this.baseSolicitudes}/${id}`, { estado }, opcionesCredenciales).pipe(
      tap(() => this.solicitudes.update((lista) => lista.filter((s) => s.id !== id))),
      map(() => undefined),
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
