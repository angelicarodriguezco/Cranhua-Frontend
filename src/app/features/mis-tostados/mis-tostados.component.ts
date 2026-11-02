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

import { LoteComprado, Tueste } from '../../core/models/tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { TuesteService, calcularMerma } from '../../core/services/tueste.service';
import { MenuLateralTostadorComponent } from '../dashboard-tostador/components/menu-lateral-tostador/menu-lateral-tostador.component';
import { EditarTuesteComponent } from './components/editar-tueste/editar-tueste.component';
import { etiquetaSvg } from './etiqueta-trazabilidad';

export const RUTA_CREAR_TUESTE = '/tostador/tostados/nuevo';
export const RUTA_EXPLORAR_COSECHAS = '/tostador/cosechas';

const kilos = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });

const porcentaje = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 });

const fechaCorta = new Intl.DateTimeFormat('es-CR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// yyyy-mm-dd como fecha local; new Date('2026-10-06') la toma en UTC y en Costa Rica sale el día 5
function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return fechaCorta.format(new Date(anio, mes - 1, dia));
}

@Component({
  selector: 'app-mis-tostados',
  imports: [EditarTuesteComponent, MenuLateralTostadorComponent, RouterLink],
  templateUrl: './mis-tostados.component.html',
  styleUrl: './mis-tostados.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MisTostadosComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly tuesteService = inject(TuesteService);
  private readonly injector = inject(Injector);
  private readonly documento = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;
  protected readonly nombreTostador = `${this.dashboard.tostador.nombre} ${this.dashboard.tostador.apellidos}`;

  protected readonly lotes = signal<LoteComprado[]>([]);
  protected readonly indicadores = computed(() => {
    const lotes = this.lotes();
    return {
      lotes: lotes.length,
      kg: lotes.reduce((total, l) => total + l.kg, 0),
      conCodigo: lotes.filter((l) => l.codigoTrazabilidad).length,
    };
  });

  /** Lote cuya ficha de código está abierta en el diálogo */
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
    // Las compras más recientes primero
    this.tuesteService
      .lotesComprados()
      .subscribe((lotes) =>
        this.lotes.set([...lotes].sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra))),
      );
  }

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }

  protected merma(tueste: Tueste): string {
    const merma = calcularMerma(tueste.pesoVerdeKg, tueste.pesoTostadoKg);
    return merma === null ? '—' : `${porcentaje.format(merma)}%`;
  }

  protected generarCodigo(lote: LoteComprado): void {
    this.tuesteService.generarCodigo(lote.id).subscribe((actualizado) => {
      this.lotes.update((lotes) => lotes.map((l) => (l.id === actualizado.id ? actualizado : l)));
      this.abrirFicha(actualizado, true);
    });
  }

  protected verCodigo(lote: LoteComprado): void {
    this.abrirFicha(lote, false);
  }

  // El foco vuelve a la acción de la fila. Al generar, el botón que lo tenía ya no existe: ahora
  // es "Ver código", con el mismo id.
  protected cerrarFicha(): void {
    const lote = this.ficha()!;
    this.dialogo().nativeElement.close();
    this.ficha.set(null);
    this.enfocar(`#codigo-${lote.id}`);
  }

  // Esc: no todos los navegadores disparan después el evento close, así que se cierra a mano
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
    const svg = etiquetaSvg(lote, this.nombreTostador);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = `trazabilidad-${lote.codigoTrazabilidad}.svg`;
    enlace.click();
    // Revocarla en el mismo tick puede cortar la descarga en Firefox
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private abrirFicha(lote: LoteComprado, recienGenerado: boolean): void {
    this.recienGenerado.set(recienGenerado);
    this.ficha.set(lote);
    // Se abre después de pintar la ficha para que showModal() tenga botones a los que dar el foco
    afterNextRender(() => this.dialogo().nativeElement.showModal(), { injector: this.injector });
  }

  // El panel y el cierre de la ficha cambian el contenido: el foco sigue al lector de pantalla
  private enfocar(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
