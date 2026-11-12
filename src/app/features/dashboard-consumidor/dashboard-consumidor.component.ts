import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TemaDashboard } from '../../core/models/dashboard-cafetalero.model';
import {
  PuntoMapaConsumidor,
  TipoPuntoMapaConsumidor,
} from '../../core/models/punto-mapa-consumidor.model';
import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';

const COLORES_TIPO: Record<TipoPuntoMapaConsumidor, string> = {
  finca: '#3f7a4f',
  tostador: '#c9a227',
  cafeteria: '#8b5a2b',
};

const CENTRO_COSTA_RICA: google.maps.LatLngLiteral = { lat: 9.92, lng: -84.12 };
const ZOOM_PAIS = 9;
const ZOOM_PIN = 14;
const PADDING_BOUNDS = 72;

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
  host: { '[attr.data-theme]': 'tema()' },
})
export class DashboardConsumidorComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboard = inject(DashboardConsumidorService);
  private readonly mapa = viewChild(GoogleMap);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly tema = this.dashboard.tema;
  protected readonly puntos = this.dashboard.puntos();
  protected readonly codigo = new FormControl('', { nonNullable: true });
  protected readonly errorBusqueda = signal<string | null>(null);
  protected readonly idsResaltados = signal<ReadonlySet<string>>(new Set());

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
    backgroundColor: this.tema() === 'oscuro' ? '#0b2b33' : '#d7e8dc',
  }));

  protected readonly leyenda: { tipo: TipoPuntoMapaConsumidor; etiqueta: string }[] = [
    { tipo: 'finca', etiqueta: 'Fincas' },
    { tipo: 'tostador', etiqueta: 'Tostadores' },
    { tipo: 'cafeteria', etiqueta: 'Cafeterías' },
  ];

  private readonly contenidosPin = new Map<string, HTMLElement>(
    this.puntos.map((punto) => [punto.id, this.crearContenidoPin(punto)]),
  );

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const ids = parseListaIds(params.get('resaltar'));
      this.idsResaltados.set(new Set(ids));
      for (const [id, nodo] of this.contenidosPin) {
        nodo.classList.toggle('pin-consumidor--resaltado', ids.includes(id));
      }

      this.apiCargada();
      this.mapa();
      this.aplicarVistaMapa(params.get('centrar'), ids);
    });
  }

  protected contenidoPin(punto: PuntoMapaConsumidor): HTMLElement {
    return this.contenidosPin.get(punto.id)!;
  }

  protected colorTipo(tipo: TipoPuntoMapaConsumidor): string {
    return COLORES_TIPO[tipo];
  }

  protected establecerTema(tema: TemaDashboard): void {
    this.dashboard.establecerTema(tema);
  }

  protected abrirPerfil(punto: PuntoMapaConsumidor): void {
    void this.router.navigateByUrl(punto.rutaPerfil);
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
    void this.router.navigate(['/explorar/finca', hallado.fincaId], {
      queryParams: { cosecha: hallado.cosechaId },
    });
  }

  private aplicarVistaMapa(centrarId: string | null, idsResaltar: string[]): void {
    const centrar = centrarId?.trim() ? this.puntoPorId(centrarId.trim()) : null;
    if (centrar) {
      this.centro.set({ ...centrar.coordenada });
      this.zoom.set(ZOOM_PIN);
      return;
    }

    const resaltados = idsResaltar
      .map((id) => this.puntoPorId(id))
      .filter((punto): punto is PuntoMapaConsumidor => punto !== undefined);

    if (resaltados.length === 0) {
      this.centro.set(CENTRO_COSTA_RICA);
      this.zoom.set(ZOOM_PAIS);
      return;
    }

    if (resaltados.length === 1) {
      this.centro.set({ ...resaltados[0].coordenada });
      this.zoom.set(ZOOM_PIN);
      return;
    }

    const mapa = this.mapa()?.googleMap;
    if (mapa) {
      const limites = new google.maps.LatLngBounds();
      resaltados.forEach((punto) => limites.extend(punto.coordenada));
      mapa.fitBounds(limites, PADDING_BOUNDS);
      return;
    }

    this.centro.set(this.centroide(resaltados));
    this.zoom.set(ZOOM_PAIS);
  }

  private puntoPorId(id: string): PuntoMapaConsumidor | undefined {
    return this.puntos.find((punto) => punto.id === id);
  }

  private centroide(puntos: PuntoMapaConsumidor[]): google.maps.LatLngLiteral {
    const total = puntos.reduce(
      (acc, punto) => ({
        lat: acc.lat + punto.coordenada.lat,
        lng: acc.lng + punto.coordenada.lng,
      }),
      { lat: 0, lng: 0 },
    );
    return { lat: total.lat / puntos.length, lng: total.lng / puntos.length };
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
