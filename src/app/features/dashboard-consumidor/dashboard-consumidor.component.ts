import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import { MenuPublico } from '../../core/models/menu-publico.model';
import { PerfilCafeteria } from '../../core/models/perfil-cafeteria.model';
import {
  CosechaActivaPublica,
  PerfilFincaPublico,
} from '../../core/models/perfil-finca-publico.model';
import { EnlacePerfilPublico, PerfilTostador } from '../../core/models/perfil-tostador.model';
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

interface SeleccionPanel {
  id: string;
  tipo: TipoPuntoMapaConsumidor;
}

interface DatoPanel {
  etiqueta: string;
  valor: string;
}

interface SeccionPanel {
  titulo: string;
  tipo: TipoPuntoMapaConsumidor;
  enlaces: EnlacePerfilPublico[];
}

interface AccionMapaPanel {
  etiqueta: string;
  resaltar: string[];
  centrar: string | null;
}

interface ResumenPanel {
  nombre: string;
  ubicacion: string;
  descripcion: string;
  datos: DatoPanel[];
  secciones: SeccionPanel[];
  lotes: CosechaActivaPublica[];
  accionMapa: AccionMapaPanel | null;
  menu: MenuPublico | null;
  portadaUrl: string | null;
}

type EstadoPanel =
  | { estado: 'cargando' | 'error' | 'no-encontrado' }
  | { estado: 'ok'; resumen: ResumenPanel };

function esTipoPunto(valor: string | null): valor is TipoPuntoMapaConsumidor {
  return valor === 'finca' || valor === 'tostador' || valor === 'cafeteria';
}

function conValor(datos: DatoPanel[]): DatoPanel[] {
  return datos.filter((dato) => dato.valor);
}

function resumenFinca(perfil: PerfilFincaPublico): ResumenPanel {
  return {
    nombre: perfil.nombre,
    ubicacion: perfil.ubicacion,
    descripcion: perfil.descripcion,
    datos: conValor([
      { etiqueta: 'Propietarios', valor: listar(perfil.propietarios) },
      { etiqueta: 'Zona cafetalera', valor: perfil.zona ?? '' },
      { etiqueta: 'Variedades', valor: listar(perfil.variedades) },
      { etiqueta: 'Procesos', valor: listar(perfil.procesos) },
      { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.enCranhuaDesde) },
    ]),
    secciones: [
      { titulo: 'Cafeterías que sirven este café', tipo: 'cafeteria', enlaces: perfil.cafeterias },
    ],
    lotes: perfil.cosechasActivas,
    accionMapa: { etiqueta: 'Ver lotes trazables', resaltar: [perfil.id], centrar: perfil.id },
    menu: null,
    portadaUrl: null,
  };
}

function resumenTostador(perfil: PerfilTostador): ResumenPanel {
  return {
    nombre: perfil.nombre,
    ubicacion: perfil.ubicacion,
    descripcion: perfil.descripcion,
    datos: conValor([
      { etiqueta: 'Estilos de tueste', valor: listar(perfil.estilos) },
      { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
    ]),
    secciones: [
      { titulo: 'Fincas con las que trabaja', tipo: 'finca', enlaces: perfil.fincas },
      { titulo: 'Dónde comprar su café', tipo: 'cafeteria', enlaces: perfil.puntosVenta },
    ],
    lotes: [],
    accionMapa: perfil.fincas.length
      ? {
          etiqueta: 'Ver fincas con las que trabaja',
          resaltar: perfil.fincas.map((finca) => finca.id),
          centrar: null,
        }
      : null,
    menu: null,
    portadaUrl: perfil.portadaUrl,
  };
}

function resumenCafeteria(perfil: PerfilCafeteria, menu: MenuPublico | null): ResumenPanel {
  return {
    nombre: perfil.nombre,
    ubicacion: perfil.ubicacion,
    descripcion: perfil.descripcion,
    datos: conValor([
      { etiqueta: 'Cafés trazables', valor: String(perfil.cafesTrazables) },
      { etiqueta: 'Horario', valor: perfil.horario },
      { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
    ]),
    secciones: [
      { titulo: 'Fincas de origen de sus cafés', tipo: 'finca', enlaces: perfil.fincas },
      { titulo: 'Tostadores de sus cafés', tipo: 'tostador', enlaces: perfil.tostadores },
    ],
    lotes: [],
    accionMapa: null,
    menu,
    portadaUrl: perfil.portadaUrl ?? null,
  };
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
  protected readonly kg = formatearKg;

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

  protected readonly seleccion = computed<SeleccionPanel | null>(
    () => {
      const params = this.queryParams();
      const id = params.get('seleccionado')?.trim();
      const tipo = params.get('tipo');
      return id && esTipoPunto(tipo) ? { id, tipo } : null;
    },
    { equal: (a, b) => a?.id === b?.id && a?.tipo === b?.tipo },
  );

  protected readonly panelAbierto = computed(() => this.seleccion() !== null);

  protected readonly menuAbierto = computed(() => this.queryParams().get('menu') === '1');

  protected readonly cosechaBuscada = computed(() => this.queryParams().get('cosecha'));

  private readonly intento = signal(0);

  private readonly carga = toSignal(
    toObservable(computed(() => ({ seleccion: this.seleccion(), intento: this.intento() }))).pipe(
      switchMap(({ seleccion }) => {
        if (!seleccion) {
          return of(null);
        }
        return this.cargarResumen(seleccion).pipe(
          map(
            (resumen): EstadoPanel =>
              resumen ? { estado: 'ok', resumen } : { estado: 'no-encontrado' },
          ),
          catchError(() => of<EstadoPanel>({ estado: 'error' })),
          startWith<EstadoPanel>({ estado: 'cargando' }),
          map((estado) => ({ id: seleccion.id, estado })),
        );
      }),
    ),
  );

  protected readonly panel = computed((): EstadoPanel | null => {
    const seleccion = this.seleccion();
    if (!seleccion) {
      return null;
    }
    const carga = this.carga();
    return carga?.id === seleccion.id ? carga.estado : { estado: 'cargando' };
  });

  protected readonly resumen = computed(() => {
    const panel = this.panel();
    return panel?.estado === 'ok' ? panel.resumen : null;
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
    this.abrirNegocio(punto.tipo, punto.id);
  }

  protected abrirNegocio(tipo: TipoPuntoMapaConsumidor, id: string): void {
    this.navegar({ seleccionado: id, tipo, menu: null });
  }

  protected cerrarPanel(): void {
    this.navegar({ seleccionado: null, tipo: null, cosecha: null, menu: null });
  }

  protected alternarMenu(): void {
    this.navegar({ menu: this.menuAbierto() ? null : '1' });
  }

  protected verEnMapa(accion: AccionMapaPanel): void {
    this.navegar({ resaltar: accion.resaltar.join(','), centrar: accion.centrar });
  }

  protected reintentar(): void {
    this.intento.update((n) => n + 1);
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
    this.navegar({
      seleccionado: hallado.fincaId,
      tipo: 'finca',
      resaltar: hallado.fincaId,
      cosecha: hallado.cosechaId,
      menu: null,
    });
  }

  private navegar(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  private cargarResumen({ id, tipo }: SeleccionPanel): Observable<ResumenPanel | null> {
    switch (tipo) {
      case 'finca':
        return this.fincas.obtener(id).pipe(map((perfil) => perfil && resumenFinca(perfil)));
      case 'tostador':
        return this.tostadores.obtener(id).pipe(map((perfil) => perfil && resumenTostador(perfil)));
      case 'cafeteria':
        return forkJoin({
          perfil: this.cafeterias.obtener(id),
          menu: this.menus.obtener(id),
        }).pipe(map(({ perfil, menu }) => perfil && resumenCafeteria(perfil, menu)));
    }
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
