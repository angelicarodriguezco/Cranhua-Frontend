import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { resumenDashboardDesdeApi } from '../mappers/dashboard-cafetalero.mapper';
import { PERFIL_CAFETALERO_SIDEBAR } from '../mocks/dashboard-cafetalero.mock';
import {
  CosechaReciente,
  DashboardCafetaleroResponseApi,
  IndicadoresDashboard,
  PerfilCafetaleroSidebar,
  RespuestaSolicitud,
  ResumenDashboard,
  SolicitudTostador,
  TemaDashboard,
} from '../models/dashboard-cafetalero.model';
import { TemaService } from './tema.service';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class DashboardCafetaleroService {
  private readonly http = inject(HttpClient);
  private readonly temas = inject(TemaService);

  private readonly indicadoresSignal = signal<IndicadoresDashboard | null>(null);
  private readonly cosechas = signal<CosechaReciente[]>([]);
  private readonly solicitudes = signal<SolicitudTostador[]>([]);

  private get baseDashboard(): string {
    return `${environment.apiUrl}/api/cafetalero/dashboard`;
  }

  private get baseSolicitudes(): string {
    return `${environment.apiUrl}/api/solicitudes`;
  }

  readonly perfilSidebar: PerfilCafetaleroSidebar = PERFIL_CAFETALERO_SIDEBAR;

  readonly indicadores = this.indicadoresSignal.asReadonly();
  readonly cosechasRecientes = this.cosechas.asReadonly();
  readonly solicitudesPendientes = this.solicitudes.asReadonly();
  readonly tema = this.temas.tema;

  alternarTema(): void {
    this.temas.alternarTema();
  }

  establecerTema(tema: TemaDashboard): void {
    this.temas.establecerTema(tema);
  }

  obtenerResumen(): Observable<ResumenDashboard> {
    return this.http
      .get<DashboardCafetaleroResponseApi>(this.baseDashboard, opcionesCredenciales)
      .pipe(
        map(resumenDashboardDesdeApi),
        tap((resumen) => this.aplicarResumen(resumen)),
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
      switchMap(() => this.obtenerResumen()),
      map(() => undefined),
    );
  }

  private aplicarResumen(resumen: ResumenDashboard): void {
    this.indicadoresSignal.set(resumen.indicadores);
    this.solicitudes.set(resumen.solicitudes);
    this.cosechas.set(resumen.cosechas);
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
