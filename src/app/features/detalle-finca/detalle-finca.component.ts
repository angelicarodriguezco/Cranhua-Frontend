import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';

import { Cosecha } from '../../core/models/cosecha.model';
import { ErrorAgregarDueno, Finca, Usuario } from '../../core/models/finca.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MenuLateralCafetaleroComponent } from '../dashboard-cafetalero/components/menu-lateral-cafetalero/menu-lateral-cafetalero.component';
import { ListaDuenosComponent } from './components/lista-duenos/lista-duenos.component';
import { MapaPerimetroComponent } from './components/mapa-perimetro/mapa-perimetro.component';
import { TablaCosechasComponent } from './components/tabla-cosechas/tabla-cosechas.component';

// Mensajes según los errores que define CP3-43
const MENSAJES_ERROR_DUENO: Record<ErrorAgregarDueno, string> = {
  'finca-inexistente': 'No encontramos esta finca.',
  'correo-inexistente': 'No hay ninguna cuenta de cafetalero con ese correo.',
  'ya-es-dueno': 'Esa persona ya es dueña de esta finca.',
};

@Component({
  selector: 'app-detalle-finca',
  imports: [
    ListaDuenosComponent,
    MapaPerimetroComponent,
    MenuLateralCafetaleroComponent,
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
  // El tema y el perfil del menú se comparten con el dashboard del cafetalero
  private readonly dashboard = inject(DashboardCafetaleroService);

  protected readonly tema = this.dashboard.tema;
  protected readonly perfilSidebar = this.dashboard.perfilSidebar;

  protected readonly cargando = signal(true);
  protected readonly finca = signal<Finca | undefined>(undefined);
  protected readonly cosechas = signal<Cosecha[]>([]);
  protected readonly errorDueno = signal<string | null>(null);

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

  protected alternarTema(): void {
    this.dashboard.alternarTema();
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
