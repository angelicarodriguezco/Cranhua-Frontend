import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';

import {
  ErrorPedido,
  EstadoPedido,
  IndicadoresPedidos,
  Pedido,
} from '../../core/models/pedido.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_EXPLORAR_TOSTADORES = '/cafeteria/tostadores';

const CLASE_ESTADO: Record<EstadoPedido, string> = {
  'En camino': 'pill pill--camino',
  Entregado: 'pill pill--entregado',
  Cancelado: 'pill pill--cancelado',
};

const INDICADORES_VACIOS: IndicadoresPedidos = {
  activos: 0,
  kgRecibidosMes: 0,
  tostadoresActivos: 0,
};

@Component({
  selector: 'app-mis-pedidos',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MisPedidosComponent {
  private readonly panel = inject(DashboardCafeteriaService);
  private readonly pedidosService = inject(PedidosService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly tema = this.panel.tema;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly procesando = signal<string | null>(null);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly indicadores = signal<IndicadoresPedidos>(INDICADORES_VACIOS);

  protected readonly rutaExplorarTostadores = RUTA_EXPLORAR_TOSTADORES;
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.pedidosService.listar().subscribe({
      next: ({ indicadores, pedidos }) => {
        this.indicadores.set(indicadores);
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.pedidos.set([]);
        this.indicadores.set(INDICADORES_VACIOS);
        this.error.set(parsearErrorAuth(err).mensaje);
        this.cargando.set(false);
      },
    });
  }

  protected marcarRecibido(pedido: Pedido): void {
    this.cambiarEstado(pedido, this.pedidosService.marcarRecibido(pedido.id));
  }

  protected cancelar(pedido: Pedido): void {
    this.cambiarEstado(pedido, this.pedidosService.cancelar(pedido.id));
  }

  private cambiarEstado(pedido: Pedido, accion: Observable<Pedido>): void {
    if (this.procesando()) {
      return;
    }
    this.procesando.set(pedido.id);
    this.errorAccion.set(null);
    accion.subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.refrescarIndicadores();
      },
      error: (err: ErrorPedido) => {
        this.errorAccion.set(err.mensaje);
        this.procesando.set(null);
      },
    });
  }

  private refrescarIndicadores(): void {
    this.pedidosService
      .listar()
      .pipe(finalize(() => this.procesando.set(null)))
      .subscribe({
        next: ({ indicadores, pedidos }) => {
          this.indicadores.set(indicadores);
          this.pedidos.set(pedidos);
        },
      });
  }

  private reemplazar(actualizado: Pedido): void {
    this.pedidos.update((pedidos) =>
      pedidos.map((p) => (p.id === actualizado.id ? actualizado : p)),
    );
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLElement>(`#estado-${actualizado.id}`)?.focus(),
      { injector: this.injector },
    );
  }
}
