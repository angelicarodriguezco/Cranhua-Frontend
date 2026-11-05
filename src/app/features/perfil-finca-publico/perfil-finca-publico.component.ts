import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { TemaDashboard } from '../../core/models/dashboard-cafetalero.model';
import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilFincaPublicoService } from '../../core/services/perfil-finca-publico.service';
import { formatearKg } from '../../shared/utils/formato';

const ZOOM_MINI = 13;
const COLOR_PIN_FINCA = '#3f7a4f';

@Component({
  selector: 'app-perfil-finca-publico',
  imports: [GoogleMap, MapAdvancedMarker, RouterLink],
  templateUrl: './perfil-finca-publico.component.html',
  styleUrl: './perfil-finca-publico.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PerfilFincaPublicoComponent {
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly servicio = inject(PerfilFincaPublicoService);
  private readonly dashboard = inject(DashboardConsumidorService);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly tema = this.dashboard.tema;
  protected readonly kg = formatearKg;

  protected readonly finca = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.servicio.obtener(params.get('id') ?? '')),
    ),
  );

  protected readonly cosechaQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('cosecha'))),
    { initialValue: this.route.snapshot.queryParamMap.get('cosecha') },
  );

  protected readonly cosechaResaltada = computed(() => {
    const finca = this.finca();
    const cosecha = this.cosechaQuery();
    return !!finca && !!cosecha && finca.cosechaActiva.id === cosecha;
  });

  protected readonly logoSrc = computed(() =>
    this.tema() === 'claro'
      ? '/images/logo-cranhua-negro.png'
      : '/images/logo-cranhua.png',
  );

  protected readonly opciones = computed<google.maps.MapOptions>(() => ({
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: true,
    zoomControl: false,
    clickableIcons: false,
    gestureHandling: 'none',
    keyboardShortcuts: false,
    backgroundColor: this.tema() === 'oscuro' ? '#0b2b33' : '#d7e8dc',
  }));

  protected readonly zoomMini = ZOOM_MINI;

  protected readonly contenidoPin = (() => {
    const root = this.document.createElement('div');
    root.className = 'pin-finca-publica';
    root.style.setProperty('--pin-color', COLOR_PIN_FINCA);
    root.setAttribute('aria-hidden', 'true');
    return root;
  })();

  protected establecerTema(tema: TemaDashboard): void {
    this.dashboard.establecerTema(tema);
  }

  protected unirLista(valores: string[]): string {
    return valores.join(', ');
  }
}
