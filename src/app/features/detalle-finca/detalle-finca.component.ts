import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';

import { Cosecha } from '../../core/models/cosecha.model';
import { ErrorAgregarDueno, Finca, Usuario } from '../../core/models/finca.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { ListaDuenosComponent } from './components/lista-duenos/lista-duenos.component';
import { MapaPerimetroComponent } from './components/mapa-perimetro/mapa-perimetro.component';
import { TablaCosechasComponent } from './components/tabla-cosechas/tabla-cosechas.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

// Mensajes según los errores que define CP3-43
const MENSAJES_ERROR_DUENO: Record<ErrorAgregarDueno, string> = {
  'finca-inexistente': 'No encontramos esta finca.',
  'correo-inexistente': 'No hay ninguna cuenta de cafetalero con ese correo.',
  'ya-es-dueno': 'Esa persona ya es dueña de esta finca.',
};

export const AVISO_ELIMINAR_FINCA =
  'Esta finca ya tiene un lote (CRH-2026-0103) comprado por un tostador, con código de trazabilidad visible para consumidores. Eliminar la finca no borra ese código, pero ya no vas a poder editar su información.';

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
  // El tema y el perfil del menú se comparten con el dashboard del cafetalero
  private readonly dashboard = inject(DashboardCafetaleroService);

  protected readonly tema = this.dashboard.tema;

  protected readonly cargando = signal(true);
  protected readonly finca = signal<Finca | undefined>(undefined);
  protected readonly cosechas = signal<Cosecha[]>([]);
  protected readonly errorDueno = signal<string | null>(null);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly avisoEliminar = AVISO_ELIMINAR_FINCA;

  protected readonly ubicacion = computed(() => {
    const canton = this.finca()?.canton;
    return canton ? `${canton.nombre}, ${canton.provincia}` : 'Sin cantón de referencia';
  });

  protected readonly duenos = computed<Usuario[]>(() => {
    const finca = this.finca();
    if (!finca) {
      return [];
    }
    const propietario = this.fincaService.usuarioPorId(finca.propietarioId);
    return [...(propietario ? [propietario] : []), ...finca.duenosAdicionales];
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

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((parametros) => parametros.get('id') ?? ''),
        switchMap((id) =>
          forkJoin({
            finca: this.fincaService.obtener(id),
            cosechas: this.cosechaService.deFinca(id),
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
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected confirmarEliminar(): void {
    const finca = this.finca();
    if (!finca) {
      this.modalEliminarAbierto.set(false);
      return;
    }
    this.fincaService.eliminar(finca.id).subscribe(() => {
      this.modalEliminarAbierto.set(false);
      void this.router.navigateByUrl('/cafetalero/fincas');
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
        this.errorDueno.set(MENSAJES_ERROR_DUENO[resultado.error]);
      }
    });
  }
}
