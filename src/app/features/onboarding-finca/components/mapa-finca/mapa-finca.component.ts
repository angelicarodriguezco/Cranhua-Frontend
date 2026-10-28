import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker, MapPolygon, MapPolyline } from '@angular/google-maps';

import { GoogleMapsService } from '../../../../core/services/google-maps.service';
import { Coordenada, Finca } from '../../../../core/models/finca.model';
import { FincaService } from '../../../../core/services/finca.service';
import { formatearHectareas } from '../../../../shared/utils/formato';
import { areaHectareas, centroide, distanciaKm } from '../../../../shared/utils/geo';

interface Estado {
  perimetro: Coordenada[];
  pin: Coordenada | null;
  pinMovido: boolean;
}

const COORDENADAS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

// Punto a medio camino entre el centro y el vértice más alejado del otro polígono,
// para que las etiquetas de dos fincas superpuestas no queden una encima de la otra
function puntoEtiqueta(perimetro: Coordenada[], otroCentro: Coordenada): Coordenada {
  const centro = centroide(perimetro);
  const lejano = perimetro.reduce((a, b) =>
    distanciaKm(b, otroCentro) > distanciaKm(a, otroCentro) ? b : a,
  );
  return { lat: (centro.lat + lejano.lat) / 2, lng: (centro.lng + lejano.lng) / 2 };
}

const DORADO = '#c9a227';
const VINO = '#b03a52';

@Component({
  selector: 'app-mapa-finca',
  imports: [GoogleMap, MapAdvancedMarker, MapPolygon, MapPolyline],
  templateUrl: './mapa-finca.component.html',
  styleUrl: './mapa-finca.component.css',
})
export class MapaFincaComponent {
  private document = inject(DOCUMENT);
  private fincaService = inject(FincaService);

  readonly perimetro = model<Coordenada[]>([]);
  readonly pin = model<Coordenada | null>(null);
  /** Finca con la que se superpone el dibujo. Mientras haya conflicto el mapa es de solo lectura. */
  readonly conflicto = input<Finca | null>(null);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  private readonly mapa = viewChild(GoogleMap);

  protected readonly dibujando = signal(true);
  protected readonly errorBusqueda = signal<string | null>(null);
  private readonly historial = signal<Estado[]>([]);
  // El pin sigue al centro del polígono hasta que el usuario lo arrastra
  private pinMovido = false;

  protected readonly soloLectura = computed(() => this.conflicto() !== null);
  protected readonly puedeDeshacer = computed(() => this.historial().length > 0);
  protected readonly area = computed(() => areaHectareas(this.perimetro()));
  protected readonly centro = computed(() => centroide(this.perimetro()));
  protected readonly etiquetaEnDibujo = computed(() => {
    const finca = this.conflicto();
    return finca ? puntoEtiqueta(this.perimetro(), centroide(finca.perimetro)) : this.centro();
  });
  protected readonly etiquetaEnExistente = computed(() => {
    const finca = this.conflicto();
    return finca ? puntoEtiqueta(finca.perimetro, this.centro()) : null;
  });
  protected readonly bordeConflicto = computed(() => {
    const perimetro = this.conflicto()?.perimetro ?? [];
    return [...perimetro, perimetro[0]];
  });

  // San Marcos de Tarrazú
  protected readonly centroInicial: google.maps.LatLngLiteral = { lat: 9.6572, lng: -84.0305 };
  protected readonly opciones: google.maps.MapOptions = {
    // Los marcadores avanzados necesitan un mapId; con DEMO_MAP_ID no hace falta configurarlo en la consola
    mapId: 'DEMO_MAP_ID',
    mapTypeId: 'hybrid',
    zoom: 16,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    // Al marcar esquinas seguidas el doble clic haría zoom en lugar de agregar el punto
    disableDoubleClickZoom: true,
    gestureHandling: 'greedy',
  };

  protected readonly estiloDibujo = computed<google.maps.PolygonOptions>(() => ({
    clickable: false,
    strokeColor: this.soloLectura() ? VINO : DORADO,
    strokeWeight: 2,
    fillColor: this.soloLectura() ? '#4b0311' : DORADO,
    fillOpacity: this.soloLectura() ? 0.45 : 0.3,
    zIndex: 2,
  }));
  protected readonly estiloLinea: google.maps.PolylineOptions = {
    clickable: false,
    strokeColor: DORADO,
    strokeWeight: 2,
  };
  protected readonly estiloExistente: google.maps.PolygonOptions = {
    clickable: false,
    strokeOpacity: 0,
    fillColor: '#8fb3a3',
    fillOpacity: 0.35,
    zIndex: 1,
  };
  // Google Maps no tiene trazos punteados: se arma con un símbolo repetido sobre una línea invisible
  protected readonly estiloBordeExistente: google.maps.PolylineOptions = {
    clickable: false,
    strokeOpacity: 0,
    icons: [
      {
        icon: { path: 'M 0,-1 0,1', strokeColor: '#e3ebe6', strokeOpacity: 1, scale: 2 },
        offset: '0',
        repeat: '10px',
      },
    ],
  };

  private readonly vertices: HTMLElement[] = [];
  protected readonly contenidoPin = this.crearElemento('pin-mapa');
  protected readonly etiquetaArea = this.crearElemento('etiqueta-mapa');
  protected readonly etiquetaDibujo = this.crearElemento(
    'etiqueta-mapa etiqueta-mapa--error',
    'Tu dibujo',
  );
  protected readonly etiquetaExistente = this.crearElemento(
    'etiqueta-mapa etiqueta-mapa--existente',
  );

  constructor() {
    effect(() => {
      this.etiquetaArea.textContent = `≈ ${formatearHectareas(this.area())}`;
    });

    effect(() => {
      const finca = this.conflicto();
      this.etiquetaExistente.textContent = finca ? `${finca.nombre} (existente)` : '';
      const mapa = this.mapa();
      if (finca && mapa) {
        const limites = new google.maps.LatLngBounds();
        [...finca.perimetro, ...this.perimetro()].forEach((p) => limites.extend(p));
        mapa.fitBounds(limites, 48);
      }
    });

    effect(() => {
      const enLapiz = this.dibujando() && !this.soloLectura();
      this.mapa()?.googleMap?.setOptions({ draggableCursor: enLapiz ? 'crosshair' : null });
    });
  }

  protected contenidoVertice(indice: number): HTMLElement {
    // Se reutiliza el mismo elemento para no reemplazar el marcador mientras se arrastra
    this.vertices[indice] ??= this.crearElemento('vertice-mapa');
    return this.vertices[indice];
  }

  protected agregarVertice(evento: google.maps.MapMouseEvent): void {
    if (!this.dibujando() || this.soloLectura() || !evento.latLng) {
      return;
    }
    this.guardarEstado();
    this.perimetro.update((perimetro) => [...perimetro, evento.latLng!.toJSON()]);
    this.seguirCentro();
  }

  protected moverVertice(indice: number, evento: google.maps.MapMouseEvent): void {
    if (!evento.latLng) {
      return;
    }
    const posicion = evento.latLng.toJSON();
    this.perimetro.update((perimetro) => perimetro.map((p, i) => (i === indice ? posicion : p)));
    this.seguirCentro();
  }

  protected moverPin(evento: google.maps.MapMouseEvent): void {
    if (evento.latLng) {
      this.pinMovido = true;
      this.pin.set(evento.latLng.toJSON());
    }
  }

  protected alternarLapiz(): void {
    this.dibujando.update((dibujando) => !dibujando);
  }

  protected guardarEstado(): void {
    const estado = { perimetro: this.perimetro(), pin: this.pin(), pinMovido: this.pinMovido };
    this.historial.update((historial) => [...historial.slice(-49), estado]);
  }

  protected deshacer(): void {
    const anterior = this.historial().at(-1);
    if (!anterior) {
      return;
    }
    this.historial.update((historial) => historial.slice(0, -1));
    this.perimetro.set(anterior.perimetro);
    this.pin.set(anterior.pin);
    this.pinMovido = anterior.pinMovido;
  }

  protected borrar(): void {
    if (this.perimetro().length === 0) {
      return;
    }
    this.guardarEstado();
    this.perimetro.set([]);
    this.pin.set(null);
    this.pinMovido = false;
    this.dibujando.set(true);
  }

  protected buscar(texto: string): void {
    this.errorBusqueda.set(null);
    if (!texto.trim()) {
      return;
    }
    const coordenadas = COORDENADAS.exec(texto);
    if (coordenadas) {
      const lat = Number(coordenadas[1]);
      const lng = Number(coordenadas[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        this.irA({ lat, lng }, 17);
        return;
      }
    }
    const canton = this.fincaService.buscarCanton(texto);
    if (canton) {
      this.irA(canton.cabecera, 14);
      return;
    }
    this.errorBusqueda.set(
      'No encontramos ese lugar. Probá con un cantón o con "latitud, longitud".',
    );
  }

  private irA(posicion: Coordenada, zoom: number): void {
    const mapa = this.mapa()?.googleMap;
    mapa?.panTo(posicion);
    mapa?.setZoom(zoom);
  }

  private seguirCentro(): void {
    if (!this.pinMovido) {
      this.pin.set(this.perimetro().length >= 3 ? this.centro() : null);
    }
  }

  private crearElemento(clases: string, texto = ''): HTMLElement {
    const elemento = this.document.createElement('div');
    elemento.className = clases;
    elemento.textContent = texto;
    return elemento;
  }
}
