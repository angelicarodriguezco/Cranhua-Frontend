import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';

import { IndicadoresLotes, LoteComprado, Tueste } from '../../core/models/tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { SesionService } from '../../core/services/sesion.service';
import { TuesteService, calcularMerma } from '../../core/services/tueste.service';
import { EditarTuesteComponent } from './components/editar-tueste/editar-tueste.component';
import { etiquetaSvg } from './etiqueta-trazabilidad';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_CREAR_TUESTE = '/tostador/tostados/nuevo';
export const RUTA_EXPLORAR_COSECHAS = '/tostador/cosechas';

const kilos = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });

const porcentaje = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 });

const fechaCorta = new Intl.DateTimeFormat('es-CR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return fechaCorta.format(new Date(anio, mes - 1, dia));
}

@Component({
  selector: 'app-mis-tostados',
  imports: [EditarTuesteComponent, MenuLateralComponent, RouterLink],
  templateUrl: './mis-tostados.component.html',
  styleUrl: './mis-tostados.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MisTostadosComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly sesion = inject(SesionService);
  private readonly tuesteService = inject(TuesteService);
  private readonly injector = inject(Injector);
  private readonly documento = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly tema = this.dashboard.tema;
  private readonly nombreSesion = computed(() => {
    const usuario = this.sesion.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellidos}`.trim() : '';
  });
  private readonly tostadorFicha = signal<string | null>(null);
  protected readonly nombreTostador = computed(() => this.tostadorFicha() ?? this.nombreSesion());

  protected readonly lotes = signal<LoteComprado[]>([]);
  protected readonly indicadores = signal<IndicadoresLotes>({ lotes: 0, kg: 0, conCodigo: 0 });

  protected readonly ficha = signal<LoteComprado | null>(null);
  protected readonly recienGenerado = signal(false);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly loteAbierto = signal<LoteComprado | null>(null);
  protected readonly tuestes = signal<Tueste[]>([]);

  protected readonly rutaCrearTueste = RUTA_CREAR_TUESTE;
  protected readonly rutaExplorarCosechas = RUTA_EXPLORAR_COSECHAS;
  protected readonly kilos = kilos;
  protected readonly formatearFecha = formatearFecha;

  constructor() {
    this.tuesteService.lotesComprados().subscribe(({ lotes, indicadores }) => {
      this.lotes.set([...lotes].sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra)));
      this.indicadores.set(indicadores);
    });
  }

  protected origen(lote: LoteComprado): string {
    return lote.proceso ? `${lote.variedad}, ${lote.proceso}` : lote.variedad;
  }

  protected merma(tueste: Tueste): string {
    const merma = calcularMerma(tueste.pesoVerdeKg, tueste.pesoTostadoKg);
    return merma === null ? '—' : `${porcentaje.format(merma)}%`;
  }

  protected generarCodigo(lote: LoteComprado): void {
    this.tuesteService
      .generarCodigo(lote.id, { fechaCompra: lote.fechaCompra, proceso: lote.proceso })
      .subscribe(({ lote: actualizado, tostador }) => {
        this.lotes.update((lotes) => lotes.map((l) => (l.id === actualizado.id ? actualizado : l)));
        this.indicadores.update((i) => ({ ...i, conCodigo: i.conCodigo + 1 }));
        this.abrirFicha(actualizado, true, tostador);
      });
  }

  protected verCodigo(lote: LoteComprado): void {
    this.abrirFicha(lote, false);
  }

  protected cerrarFicha(): void {
    const lote = this.ficha()!;
    this.dialogo().nativeElement.close();
    this.ficha.set(null);
    this.tostadorFicha.set(null);
    this.enfocar(`#codigo-${lote.id}`);
  }

  protected alCancelarFicha(evento: Event): void {
    evento.preventDefault();
    this.cerrarFicha();
  }
  protected alternarTuestes(lote: LoteComprado): void {
    if (this.loteAbierto()?.id === lote.id) {
      this.cerrarTuestes();
      return;
    }
    this.tuesteService.tuestesDelLote(lote.id).subscribe((tuestes) => {
      this.tuestes.set(tuestes);
      this.loteAbierto.set(lote);
      this.enfocar('#titulo-tuestes');
    });
  }

  protected cerrarTuestes(): void {
    const lote = this.loteAbierto()!;
    this.loteAbierto.set(null);
    this.enfocar(`#tuestes-${lote.id}`);
  }

  protected alGuardarTueste(tueste: Tueste): void {
    this.tuestes.update((tuestes) => tuestes.map((t) => (t.id === tueste.id ? tueste : t)));
  }

  protected descargarCodigo(lote: LoteComprado): void {
    const svg = etiquetaSvg(lote, this.nombreTostador());
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = `trazabilidad-${lote.codigoTrazabilidad}.svg`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private abrirFicha(lote: LoteComprado, recienGenerado: boolean, tostador?: string): void {
    this.recienGenerado.set(recienGenerado);
    this.tostadorFicha.set(tostador ?? null);
    this.ficha.set(lote);
    afterNextRender(() => this.dialogo().nativeElement.showModal(), { injector: this.injector });
  }

  private enfocar(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
