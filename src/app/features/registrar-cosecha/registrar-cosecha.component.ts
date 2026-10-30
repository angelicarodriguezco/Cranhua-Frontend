import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { Cosecha, NuevaCosecha } from '../../core/models/cosecha.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MenuLateralCafetaleroComponent } from '../dashboard-cafetalero/components/menu-lateral-cafetalero/menu-lateral-cafetalero.component';
import {
  DatosPasoCosecha,
  PasoDatosCosechaComponent,
} from './components/paso-datos-cosecha/paso-datos-cosecha.component';
import {
  DatosPasoSeleccion,
  PasoSeleccionCatacionComponent,
} from './components/paso-seleccion-catacion/paso-seleccion-catacion.component';
import { ResumenCosechaComponent } from './components/resumen-cosecha/resumen-cosecha.component';

type Paso = 'datos' | 'seleccion' | 'exito';

@Component({
  selector: 'app-registrar-cosecha',
  imports: [
    MenuLateralCafetaleroComponent,
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

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;

  private readonly idRuta = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

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
      return 'Paso 2 de 2 — Selección final, catación y caracolillo.';
    }
    return 'Paso 1 de 2 — Datos de la cosecha y reparto por proceso.';
  });

  private readonly contenido = viewChild<ElementRef<HTMLElement>>('contenido');

  protected readonly paso = signal<Paso>('datos');
  protected readonly datosPaso1 = signal<DatosPasoCosecha | null>(null);
  protected readonly datosPaso2 = signal<DatosPasoSeleccion | null>(null);
  protected readonly cosechaGuardada = signal<Cosecha | null>(null);
  protected readonly modalEliminarAbierto = signal(false);

  protected readonly valorInicialPaso1 = computed((): Partial<DatosPasoCosecha> | null => {
    const borrador = this.datosPaso1();
    if (borrador) {
      return borrador;
    }

    const id = this.cosechaId();
    if (!id) {
      return null;
    }

    const cosecha = this.cosechaService.obtener(id);
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

    const id = this.cosechaId();
    if (!id) {
      return null;
    }

    const cosecha = this.cosechaService.obtener(id);
    if (!cosecha) {
      return null;
    }

    return {
      pesoAntesKg: cosecha.pesoAntesKg,
      pesoTrasSeleccionKg: cosecha.pesoTrasSeleccionKg,
      separoCaracolillo: cosecha.separoCaracolillo,
      pesoCaracolilloKg: cosecha.pesoCaracolilloKg,
      puntajeSca: cosecha.puntajeSca,
      notasCatacion: cosecha.notasCatacion,
    };
  });

  protected readonly pesoAntesSugerido = computed(() => {
    const paso1 = this.datosPaso1();
    return paso1?.cantidadTotalKg ?? null;
  });

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }

  protected volver(): void {
    if (this.paso() === 'seleccion') {
      this.paso.set('datos');
      return;
    }
    if (this.paso() === 'exito') {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    this.location.back();
  }

  protected onContinuarPaso1(datos: DatosPasoCosecha): void {
    this.datosPaso1.set(datos);
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
    };

    const id = this.cosechaId();
    const guardada = id
      ? this.cosechaService.actualizar(id, payload)
      : this.cosechaService.crear(payload);

    if (!guardada) {
      return;
    }

    this.cosechaGuardada.set(guardada);
    this.paso.set('exito');
    this.scrollAlInicio();
  }

  protected onRegistrarOtra(): void {
    this.datosPaso1.set(null);
    this.datosPaso2.set(null);
    this.cosechaGuardada.set(null);
    this.paso.set('datos');
    void this.router.navigateByUrl('/registrar-cosecha');
    this.scrollAlInicio();
  }

  private scrollAlInicio(): void {
    queueMicrotask(() => {
      this.contenido()?.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  protected onVerCosecha(_id: string): void {
    void this.router.navigateByUrl('/historial');
  }

  protected abrirModalEliminar(): void {
    if (!this.modoEdicion()) {
      return;
    }
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected onConfirmarEliminar(): void {
    const id = this.cosechaId();
    if (!id) {
      this.modalEliminarAbierto.set(false);
      return;
    }

    const eliminada = this.cosechaService.eliminar(id);
    this.modalEliminarAbierto.set(false);

    if (eliminada) {
      void this.router.navigateByUrl('/historial');
    }
  }
}
