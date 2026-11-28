import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { Cosecha, ErrorCosecha } from '../../core/models/cosecha.model';
import { ErrorRegistroFinca, Finca, Usuario } from '../../core/models/finca.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { ListaDuenosComponent } from './components/lista-duenos/lista-duenos.component';
import { MapaPerimetroComponent } from './components/mapa-perimetro/mapa-perimetro.component';
import { TablaCosechasComponent } from './components/tabla-cosechas/tabla-cosechas.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-detalle-finca',
  imports: [
    ListaDuenosComponent,
    MapaPerimetroComponent,
    MenuLateralComponent,
    ModalConfirmacionComponent,
    RouterLink,
    TablaCosechasComponent,
    ZonaPeligroComponent,
  ],
  templateUrl: './detalle-finca.component.html',
  styleUrl: './detalle-finca.component.css',
})
export class DetalleFincaComponent {
  private readonly fincaService = inject(FincaService);
  private readonly cosechaService = inject(CosechaService);
  private readonly router = inject(Router);
  private readonly usuario = inject(SesionService).usuario;
  // El tema y el perfil del menú se comparten con el dashboard del cafetalero
  private readonly dashboard = inject(DashboardCafetaleroService);

  protected readonly tema = this.dashboard.tema;

  protected readonly usuarioId = computed(() => this.usuario()?.id ?? '');
  protected readonly cargando = signal(true);
  protected readonly finca = signal<Finca | undefined>(undefined);
  protected readonly cosechas = signal<Cosecha[]>([]);
  protected readonly errorDueno = signal<string | null>(null);
  protected readonly cosechaProcesando = signal<string | null>(null);
  protected readonly errorCosecha = signal<string | null>(null);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal<string | null>(null);

  protected readonly descripcionEliminar = computed(() =>
    this.finca()?.duenosAdicionales.length
      ? 'Vas a dejar de ser dueño de esta finca. Los demás dueños la conservan.'
      : 'La finca y sus cosechas dejan de aparecer en tu cuenta, en el mapa y en Explorar. Los códigos de lotes ya vendidos siguen consultables.',
  );

  // Con otros dueños la finca sigue existiendo, así que no hace falta avisar
  protected readonly avisoEliminar = computed(() => {
    const finca = this.finca();
    const historial = finca?.historialTrazabilidad;
    if (!finca || finca.duenosAdicionales.length || !historial?.tieneHistorial) {
      return null;
    }
    return `Esta finca tiene lotes con código de trazabilidad, como ${historial.codigoEjemplo}, que ya están en bolsas de café. Eliminarla no borra esos códigos: van a seguir consultables para tostadores y consumidores.`;
  });

  protected readonly ubicacion = computed(() => {
    const canton = this.finca()?.canton;
    return canton ? `${canton.nombre}, ${canton.provincia}` : 'Sin cantón de referencia';
  });

  protected readonly duenos = computed<Usuario[]>(() => {
    const finca = this.finca();
    if (!finca) {
      return [];
    }
    // Solo los dueños ven la finca, así que el usuario actual va primero
    const usuario = this.usuario();
    const actual = usuario && finca.propietarioId === usuario.id ? [usuario] : [];
    return [...actual, ...finca.duenosAdicionales];
  });

  protected readonly indicadores = computed(() => {
    const hectareas = this.finca()?.areaHectareas ?? 0;
    return {
      hectareas: hectareas.toFixed(hectareas < 1 ? 2 : 1),
      cosechasActivas: this.cosechas().length,
      kgDisponibles: this.cosechas().reduce((total, c) => total + (c.kgDisponibles ?? 0), 0),
      duenos: this.duenos().length,
    };
  });

  private readonly ruta = inject(ActivatedRoute);

  protected readonly cosechaResaltada = toSignal(
    this.ruta.queryParamMap.pipe(map((parametros) => parametros.get('cosecha'))),
    { initialValue: null },
  );

  constructor() {
    this.ruta.paramMap
      .pipe(
        map((parametros) => parametros.get('id') ?? ''),
        switchMap((id) =>
          forkJoin({
            finca: this.fincaService.obtener(id).pipe(catchError(() => of(undefined))),
            cosechas: this.cosechaService.deFinca(id).pipe(catchError(() => of([]))),
          }),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ finca, cosechas }) => {
        this.finca.set(finca);
        this.cosechas.set(cosechas);
        this.errorDueno.set(null);
        this.cargando.set(false);
      });
  }

  protected abrirModalEliminar(): void {
    this.errorEliminar.set(null);
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    if (!this.eliminando()) {
      this.modalEliminarAbierto.set(false);
    }
  }

  protected confirmarEliminar(): void {
    const finca = this.finca();
    if (!finca || this.eliminando()) {
      return;
    }
    this.eliminando.set(true);
    this.fincaService.eliminar(finca.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        void this.router.navigateByUrl('/cafetalero/fincas');
      },
      error: (error: ErrorRegistroFinca) => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        this.errorEliminar.set(error.mensaje);
      },
    });
  }

  protected cambiarEstadoCosecha(id: string, estado: 'PUBLICADA' | 'BORRADOR'): void {
    this.cosechaProcesando.set(id);
    this.errorCosecha.set(null);
    this.cosechaService.cambiarEstado(id, estado).subscribe({
      next: (actualizada) => {
        this.cosechas.update((lista) => lista.map((c) => (c.id === id ? actualizada : c)));
        this.cosechaProcesando.set(null);
      },
      error: (error: ErrorCosecha) => {
        this.errorCosecha.set(error.mensaje);
        this.cosechaProcesando.set(null);
      },
    });
  }

  protected agregarDueno(correo: string): void {
    const finca = this.finca();
    if (!finca) {
      return;
    }
    this.fincaService.agregarDueno(finca.id, correo).subscribe((resultado) => {
      if (resultado.agregado) {
        this.finca.set(resultado.finca);
        this.errorDueno.set(null);
      } else {
        this.errorDueno.set(resultado.mensaje);
      }
    });
  }
}
