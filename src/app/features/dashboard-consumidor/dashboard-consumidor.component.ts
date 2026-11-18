import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MenuPublico } from '../../core/models/menu-publico.model';
import {
  PuntoMapaConsumidor,
  TipoPuntoMapaConsumidor,
} from '../../core/models/punto-mapa-consumidor.model';
import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { MenuPublicoService } from '../../core/services/menu-publico.service';
import { PerfilCafeteriaService } from '../../core/services/perfil-cafeteria.service';
import { PerfilFincaPublicoService } from '../../core/services/perfil-finca-publico.service';
import { PerfilTostadorService } from '../../core/services/perfil-tostador.service';
import {
  formatearColones,
  formatearKg,
  formatearMesAnio,
  listar,
} from '../../shared/utils/formato';

const COLORES_TIPO: Record<TipoPuntoMapaConsumidor, string> = {
  finca: '#1c3426',
  tostador: '#a57008',
  cafeteria: '#912316',
};

const ETIQUETAS_TIPO: Record<TipoPuntoMapaConsumidor, string> = {
  finca: 'Finca',
  tostador: 'Tostador',
  cafeteria: 'Cafetería',
};

const CENTRO_COSTA_RICA: google.maps.LatLngLiteral = { lat: 9.92, lng: -84.12 };
const ZOOM_PAIS = 9;
const ZOOM_LOCAL = 12;

export interface DatoPanelExplorar {
  etiqueta: string;
  valor: string;
}

export interface EnlacePanelExplorar {
  id: string;
  nombre: string;
  detalle: string;
}

export interface ResumenPanelExplorar {
  punto: PuntoMapaConsumidor;
  rol: string;
  descripcion: string;
  datos: DatoPanelExplorar[];
  enlaces: EnlacePanelExplorar[];
  tituloEnlaces: string;
  menu: MenuPublico | null;
  imagenPortada?: string;
  codigoResaltado?: string;
}

function parseListaIds(valor: string | null): string[] {
  if (!valor) {
    return [];
  }
  return [
    ...new Set(
      valor
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

@Component({
  selector: 'app-dashboard-consumidor',
  imports: [GoogleMap, MapAdvancedMarker, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard-consumidor.component.html',
  styleUrl: './dashboard-consumidor.component.css',
  host: {
    '[attr.data-theme]': 'tema()',
    '[class.dashboard-consumidor-host--panel]': 'panelAbierto()',
  },
})
export class DashboardConsumidorComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboard = inject(DashboardConsumidorService);
  private readonly fincas = inject(PerfilFincaPublicoService);
  private readonly tostadores = inject(PerfilTostadorService);
  private readonly cafeterias = inject(PerfilCafeteriaService);
  private readonly menus = inject(MenuPublicoService);
  private readonly mapa = viewChild(GoogleMap);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly tema = this.dashboard.tema;
  protected readonly puntos = toSignal(this.dashboard.puntos(), {
    initialValue: [] as PuntoMapaConsumidor[],
  });
  protected readonly codigo = new FormControl('', { nonNullable: true });
  protected readonly errorBusqueda = signal<string | null>(null);
  protected readonly idsResaltados = signal<ReadonlySet<string>>(new Set());
  protected readonly precio = formatearColones;

  protected readonly logoSrc = computed(() =>
    this.tema() === 'claro' ? '/images/logo-cranhua-negro.png' : '/images/logo-cranhua.png',
  );

  protected readonly centro = signal(CENTRO_COSTA_RICA);
  protected readonly zoom = signal(ZOOM_PAIS);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly opciones = computed<google.maps.MapOptions>(() => ({
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    backgroundColor: this.tema() === 'oscuro' ? '#1c3426' : '#e8dccb',
  }));

  protected readonly leyenda: { tipo: TipoPuntoMapaConsumidor; etiqueta: string }[] = [
    { tipo: 'finca', etiqueta: 'Fincas' },
    { tipo: 'tostador', etiqueta: 'Tostadores' },
    { tipo: 'cafeteria', etiqueta: 'Cafeterías' },
  ];

  private readonly contenidosPin = new Map<string, HTMLElement>();

  protected readonly puntoSeleccionado = computed(() => {
    const id = this.queryParams().get('seleccionado')?.trim();
    if (!id) {
      return null;
    }
    return this.puntoPorId(id) ?? null;
  });

  protected readonly panelAbierto = computed(() => this.puntoSeleccionado() !== null);

  protected readonly menuAbierto = computed(() => this.queryParams().get('menu') === '1');

  protected readonly resumenPanel = computed((): ResumenPanelExplorar | null => {
    const punto = this.puntoSeleccionado();
    if (!punto) {
      return null;
    }

    const cosechaQuery = this.queryParams().get('cosecha')?.trim() || undefined;

    if (punto.tipo === 'finca') {
      const perfil = this.fincas.obtenerSync(punto.id);
      if (!perfil) {
        return this.resumenBasico(punto);
      }
      const codigoResaltado =
        cosechaQuery && perfil.cosechaActiva.id === cosechaQuery
          ? perfil.cosechaActiva.codigo
          : undefined;
      return {
        punto,
        rol: perfil.etiqueta,
        descripcion: perfil.descripcion,
        datos: [
          { etiqueta: 'Propietario', valor: perfil.propietario },
          { etiqueta: 'Altitud', valor: `${perfil.altitudMsnm} msnm` },
          { etiqueta: 'Variedades', valor: listar(perfil.variedades) },
          { etiqueta: 'Procesos', valor: listar(perfil.procesos) },
          {
            etiqueta: 'Cosecha activa',
            valor: `${perfil.cosechaActiva.variedad} · ${perfil.cosechaActiva.proceso} · ${formatearKg(perfil.cosechaActiva.kilos)}`,
          },
          { etiqueta: 'En Cránhua desde', valor: perfil.enCranhuaDesde },
        ],
        enlaces: perfil.cafeterias.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          detalle: c.ubicacionLabel,
        })),
        tituloEnlaces: 'Cafeterías que sirven este café',
        menu: null,
        imagenPortada: perfil.imagenPortada,
        codigoResaltado,
      };
    }

    if (punto.tipo === 'tostador') {
      const perfil = this.tostadores.obtener(punto.id);
      if (!perfil) {
        return this.resumenBasico(punto);
      }
      return {
        punto,
        rol: ETIQUETAS_TIPO.tostador,
        descripcion: perfil.descripcion,
        datos: [
          { etiqueta: 'Estilos de tueste', valor: listar(perfil.estilosTueste) },
          { etiqueta: 'Café tostado este año', valor: formatearKg(perfil.kgTostadosAnio) },
          { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
        ],
        enlaces: [
          ...perfil.fincas.map((f) => ({
            id: f.id,
            nombre: f.nombre,
            detalle: f.ubicacion,
          })),
          ...perfil.puntosVenta.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            detalle: p.ubicacion,
          })),
        ],
        tituloEnlaces: 'También en la cadena',
        menu: null,
      };
    }

    const perfil = this.cafeterias.obtener(punto.id);
    if (!perfil) {
      return this.resumenBasico(punto);
    }
    return {
      punto,
      rol: ETIQUETAS_TIPO.cafeteria,
      descripcion: perfil.descripcion,
      datos: [
        { etiqueta: 'Cafés trazables', valor: String(perfil.cafesTrazables) },
        { etiqueta: 'Horario', valor: perfil.horario },
        { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
      ],
      enlaces: perfil.fincas.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        detalle: f.ubicacion,
      })),
      tituloEnlaces: 'Fincas de origen de sus cafés',
      menu: this.menus.obtener(perfil.id),
    };
  });

  constructor() {
    effect(() => {
      this.sincronizarContenidosPin(this.puntos());
    });

    effect(() => {
      const params = this.queryParams();
      const puntos = this.puntos();
      const ids = parseListaIds(params.get('resaltar'));
      const seleccionado = params.get('seleccionado')?.trim() || null;
      if (seleccionado && !ids.includes(seleccionado)) {
        ids.push(seleccionado);
      }
      this.idsResaltados.set(new Set(ids));
      for (const [id, nodo] of this.contenidosPin) {
        nodo.classList.toggle('pin-consumidor--resaltado', ids.includes(id));
        nodo.classList.toggle('pin-consumidor--seleccionado', id === seleccionado);
      }

      const centrarId = params.get('centrar')?.trim();
      if (centrarId) {
        const punto = puntos.find((p) => p.id === centrarId);
        if (punto) {
          this.centro.set(punto.coordenada);
          this.zoom.set(ZOOM_LOCAL);
        }
      }

      this.apiCargada();
      this.mapa();
    });

    effect(() => {
      this.panelAbierto();
      this.apiCargada();
      const mapa = this.mapa()?.googleMap;
      if (!mapa) {
        return;
      }
      window.setTimeout(() => {
        google.maps.event.trigger(mapa, 'resize');
      }, 360);
    });
  }

  protected contenidoPin(punto: PuntoMapaConsumidor): HTMLElement {
    let nodo = this.contenidosPin.get(punto.id);
    if (!nodo) {
      nodo = this.crearContenidoPin(punto);
      this.contenidosPin.set(punto.id, nodo);
    }
    return nodo;
  }

  protected colorTipo(tipo: TipoPuntoMapaConsumidor): string {
    return COLORES_TIPO[tipo];
  }

  protected etiquetaTipo(tipo: TipoPuntoMapaConsumidor): string {
    return ETIQUETAS_TIPO[tipo];
  }

  protected abrirPerfil(punto: PuntoMapaConsumidor): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        seleccionado: punto.id,
        menu: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected abrirDesdePanel(id: string): void {
    const punto = this.puntoPorId(id);
    if (!punto) {
      return;
    }
    this.abrirPerfil(punto);
  }

  protected cerrarPanel(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        seleccionado: null,
        cosecha: null,
        menu: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected alternarMenu(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        menu: this.menuAbierto() ? null : '1',
      },
      queryParamsHandling: 'merge',
    });
  }

  protected buscar(): void {
    const codigo = this.codigo.value;
    const hallado = this.dashboard.buscarCodigo(codigo);
    if (!hallado) {
      this.errorBusqueda.set(
        'No encontramos ese código. Probá con uno válido, por ejemplo CRH-2026-0103.',
      );
      return;
    }
    this.errorBusqueda.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        seleccionado: hallado.fincaId,
        resaltar: hallado.fincaId,
        cosecha: hallado.cosechaId,
        menu: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private resumenBasico(punto: PuntoMapaConsumidor): ResumenPanelExplorar {
    return {
      punto,
      rol: ETIQUETAS_TIPO[punto.tipo],
      descripcion: 'Todavía no hay más detalles publicados para este negocio.',
      datos: [{ etiqueta: 'Ubicación', valor: punto.ubicacionLabel }],
      enlaces: [],
      tituloEnlaces: 'También en la cadena',
      menu: null,
    };
  }

  private puntoPorId(id: string): PuntoMapaConsumidor | undefined {
    return this.puntos().find((punto) => punto.id === id);
  }

  private sincronizarContenidosPin(puntos: PuntoMapaConsumidor[]): void {
    const vigentes = new Set(puntos.map((punto) => punto.id));
    for (const id of [...this.contenidosPin.keys()]) {
      if (!vigentes.has(id)) {
        this.contenidosPin.delete(id);
      }
    }
    for (const punto of puntos) {
      if (!this.contenidosPin.has(punto.id)) {
        this.contenidosPin.set(punto.id, this.crearContenidoPin(punto));
      }
    }
  }

  private crearContenidoPin(punto: PuntoMapaConsumidor): HTMLElement {
    const root = this.document.createElement('div');
    root.className = `pin-consumidor pin-consumidor--${punto.tipo}`;
    root.style.setProperty('--pin-color', COLORES_TIPO[punto.tipo]);

    const cabeza = this.document.createElement('div');
    cabeza.className = 'pin-consumidor__cabeza';
    cabeza.setAttribute('aria-hidden', 'true');

    const etiqueta = this.document.createElement('div');
    etiqueta.className = 'pin-consumidor__etiqueta';

    const nombre = this.document.createElement('strong');
    nombre.textContent = punto.nombre;

    const ubicacion = this.document.createElement('span');
    ubicacion.textContent = punto.ubicacionLabel;

    etiqueta.append(nombre, ubicacion);
    root.append(cabeza, etiqueta);
    return root;
  }
}
