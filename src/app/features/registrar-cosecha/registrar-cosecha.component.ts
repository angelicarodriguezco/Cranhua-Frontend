import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { Cosecha, ErrorCosecha, NuevaCosecha } from '../../core/models/cosecha.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { erroresEnFormulario } from '../../core/utils/cosecha-desde-api';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import {
  DatosPasoCosecha,
  PasoDatosCosechaComponent,
} from './components/paso-datos-cosecha/paso-datos-cosecha.component';
import {
  DatosPasoSeleccion,
  PasoSeleccionCatacionComponent,
} from './components/paso-seleccion-catacion/paso-seleccion-catacion.component';
import { ResumenCosechaComponent } from './components/resumen-cosecha/resumen-cosecha.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

type Paso = 'datos' | 'seleccion' | 'exito';

const CAMPOS_PASO_DATOS = [
  'fincaId',
  'variedad',
  'alturaMsnm',
  'cantidadTotalKg',
  'fechaInicio',
  'fechaFin',
  'procesos',
];

@Component({
  selector: 'app-registrar-cosecha',
  imports: [
    MenuLateralComponent,
    PasoDatosCosechaComponent,
    PasoSeleccionCatacionComponent,
    ResumenCosechaComponent,
    ZonaPeligroComponent,
    ModalConfirmacionComponent,
  ],
  templateUrl: './registrar-cosecha.component.html',
  styleUrl: './registrar-cosecha.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class RegistrarCosechaComponent {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly cosechaService = inject(CosechaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly tema = this.dashboard.tema;

  private readonly idRuta = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  protected readonly cosechaId = computed(() => this.idRuta());
  protected readonly modoEdicion = computed(() => this.idRuta() !== null);

  protected readonly titulo = computed(() => {
    if (this.paso() === 'exito') {
      return this.modoEdicion() ? 'Cosecha actualizada' : 'Cosecha registrada';
    }
    return this.modoEdicion() ? 'Editar cosecha' : 'Registrar cosecha';
  });

  protected readonly subtitulo = computed(() => {
    if (this.paso() === 'seleccion') {
      return 'Paso 2 de 2 — Selección final, catación y precio.';
    }
    return 'Paso 1 de 2 — Datos de la cosecha y reparto por proceso.';
  });

  private readonly contenido = viewChild<ElementRef<HTMLElement>>('contenido');

  protected readonly paso = signal<Paso>('datos');
  protected readonly datosPaso1 = signal<DatosPasoCosecha | null>(null);
  protected readonly datosPaso2 = signal<DatosPasoSeleccion | null>(null);
  protected readonly cosechaGuardada = signal<Cosecha | null>(null);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly publicando = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly errorGeneral = signal<string | null>(null);

  private readonly cosechaCargada = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) =>
        id
          ? this.cosechaService.obtener(id).pipe(
              catchError((error: ErrorCosecha) => {
                this.errorGeneral.set(error.mensaje);
                return of(null);
              }),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  protected readonly nombreAEliminar = computed(() => this.cosechaCargada()?.variedad);

  protected readonly valorInicialPaso1 = computed((): Partial<DatosPasoCosecha> | null => {
    const borrador = this.datosPaso1();
    if (borrador) {
      return borrador;
    }

    const cosecha = this.cosechaCargada();
    if (!cosecha) {
      return null;
    }

    return {
      fincaId: cosecha.fincaId,
      variedad: cosecha.variedad,
      alturaMsnm: cosecha.alturaMsnm,
      cantidadTotalKg: cosecha.cantidadTotalKg,
      fechaInicio: cosecha.fechaInicio,
      fechaFin: cosecha.fechaFin,
      procesos: cosecha.procesos,
    };
  });

  protected readonly valorInicialPaso2 = computed((): Partial<DatosPasoSeleccion> | null => {
    const borrador = this.datosPaso2();
    if (borrador) {
      return borrador;
    }

    const cosecha = this.cosechaCargada();
    if (!cosecha) {
      return null;
    }

    return {
      pesoAntesKg: cosecha.pesoAntesKg ?? undefined,
      pesoTrasSeleccionKg: cosecha.pesoTrasSeleccionKg ?? undefined,
      separoCaracolillo: cosecha.separoCaracolillo,
      pesoCaracolilloKg: cosecha.pesoCaracolilloKg,
      puntajeSca: cosecha.puntajeSca,
      notasCatacion: cosecha.notasCatacion,
      precioKg: cosecha.precioKg,
    };
  });

  protected readonly pesoAntesSugerido = computed(() => {
    const paso1 = this.datosPaso1();
    return paso1?.cantidadTotalKg ?? null;
  });

  protected volver(): void {
    if (this.paso() === 'seleccion') {
      this.paso.set('datos');
      return;
    }
    if (this.paso() === 'exito') {
      void this.router.navigateByUrl('/cafetalero/dashboard');
      return;
    }
    this.location.back();
  }

  protected onContinuarPaso1(datos: DatosPasoCosecha): void {
    this.datosPaso1.set(datos);
    this.erroresServidor.set({});
    this.paso.set('seleccion');
    this.scrollAlInicio();
  }

  protected onCancelarPaso1(): void {
    this.location.back();
  }

  protected onAtrasPaso2(): void {
    this.paso.set('datos');
    this.scrollAlInicio();
  }

  protected onGuardarPaso2(datos: DatosPasoSeleccion): void {
    const paso1 = this.datosPaso1();
    if (!paso1) {
      this.paso.set('datos');
      this.scrollAlInicio();
      return;
    }

    this.datosPaso2.set(datos);

    const payload: NuevaCosecha = {
      fincaId: paso1.fincaId,
      variedad: paso1.variedad,
      alturaMsnm: paso1.alturaMsnm,
      cantidadTotalKg: paso1.cantidadTotalKg,
      fechaInicio: paso1.fechaInicio,
      fechaFin: paso1.fechaFin,
      procesos: paso1.procesos,
      pesoAntesKg: datos.pesoAntesKg,
      pesoTrasSeleccionKg: datos.pesoTrasSeleccionKg,
      separoCaracolillo: datos.separoCaracolillo,
      pesoCaracolilloKg: datos.pesoCaracolilloKg,
      puntajeSca: datos.puntajeSca,
      notasCatacion: datos.notasCatacion,
      precioKg: datos.precioKg,
    };

    this.guardando.set(true);
    this.erroresServidor.set({});
    this.errorGeneral.set(null);

    const id = this.cosechaId();
    if (id) {
      const { fincaId, ...cambios } = payload;
      this.cosechaService.actualizar(id, cambios).subscribe({
        next: () =>
          void this.router.navigate(['/cafetalero/fincas', fincaId], {
            queryParams: { cosecha: id },
          }),
        error: (error: ErrorCosecha) => this.mostrarErrores(error),
      });
      return;
    }

    this.cosechaService.registrar(payload).subscribe({
      next: (guardada) => {
        this.guardando.set(false);
        this.cosechaGuardada.set(guardada);
        this.paso.set('exito');
        this.scrollAlInicio();
      },
      error: (error: ErrorCosecha) => this.mostrarErrores(error),
    });
  }

  // El 409 de una cosecha con lotes trae un mensaje general y los campos bloqueados
  private mostrarErrores(error: ErrorCosecha): void {
    this.guardando.set(false);
    const errores = erroresEnFormulario(error.errores);
    const campos = Object.keys(errores);
    if (campos.length === 0 || error.estado === 409) {
      this.errorGeneral.set(error.mensaje);
    }
    this.erroresServidor.set(errores);
    if (campos.some((campo) => CAMPOS_PASO_DATOS.includes(campo))) {
      this.paso.set('datos');
    }
    this.scrollAlInicio();
  }

  protected onRegistrarOtra(): void {
    this.datosPaso1.set(null);
    this.datosPaso2.set(null);
    this.cosechaGuardada.set(null);
    this.erroresServidor.set({});
    this.errorGeneral.set(null);
    this.paso.set('datos');
    void this.router.navigateByUrl('/cafetalero/registrar-cosecha');
    this.scrollAlInicio();
  }

  private scrollAlInicio(): void {
    queueMicrotask(() => {
      this.contenido()?.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  protected onVerCosecha(id: string): void {
    const fincaId = this.cosechaGuardada()?.fincaId;
    void this.router.navigate(['/cafetalero/fincas', fincaId], { queryParams: { cosecha: id } });
  }

  protected onPublicar(id: string): void {
    this.publicando.set(true);
    this.errorGeneral.set(null);
    this.cosechaService.cambiarEstado(id, 'PUBLICADA').subscribe({
      next: (publicada) => {
        this.publicando.set(false);
        this.cosechaGuardada.set(publicada);
      },
      error: (error: ErrorCosecha) => {
        this.publicando.set(false);
        this.errorGeneral.set(error.mensaje);
      },
    });
  }

  protected abrirModalEliminar(): void {
    if (!this.modoEdicion()) {
      return;
    }
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    if (!this.eliminando()) {
      this.modalEliminarAbierto.set(false);
    }
  }

  protected onConfirmarEliminar(): void {
    const cosecha = this.cosechaCargada();
    if (!cosecha || this.eliminando()) {
      return;
    }
    this.eliminando.set(true);
    this.errorGeneral.set(null);
    this.cosechaService.eliminar(cosecha.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        void this.router.navigate(['/cafetalero/fincas', cosecha.fincaId]);
      },
      error: (error: ErrorCosecha) => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        this.errorGeneral.set(error.mensaje);
        this.scrollAlInicio();
      },
    });
  }
}
