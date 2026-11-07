import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { EstadoPedido, Pedido } from '../../core/models/pedido.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { PedidosService, calcularIndicadores } from '../../core/services/pedidos.service';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_EXPLORAR_TOSTADORES = '/cafeteria/tostadores';

const CLASE_ESTADO: Record<EstadoPedido, string> = {
  'En camino': 'pill pill--camino',
  Entregado: 'pill pill--entregado',
  Cancelado: 'pill pill--cancelado',
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

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly indicadores = computed(() => calcularIndicadores(this.pedidos()));

  protected readonly rutaExplorarTostadores = RUTA_EXPLORAR_TOSTADORES;
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;

  constructor() {
    this.pedidosService.listar().subscribe((pedidos) => this.pedidos.set(pedidos));
  }

  protected marcarRecibido(pedido: Pedido): void {
    this.pedidosService.marcarRecibido(pedido.id).subscribe((p) => this.reemplazar(p));
  }

  protected cancelar(pedido: Pedido): void {
    this.pedidosService.cancelar(pedido.id).subscribe((p) => this.reemplazar(p));
  }

  // Los botones desaparecen con el cambio de estado: el foco pasa al estado nuevo para que el
  // lector de pantalla lo anuncie en vez de quedar en el body
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
