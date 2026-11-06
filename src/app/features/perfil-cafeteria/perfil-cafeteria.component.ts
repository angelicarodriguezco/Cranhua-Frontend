import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { TemaDashboard } from '../../core/models/dashboard-cafetalero.model';
import { PerfilCafeteria } from '../../core/models/perfil-cafeteria.model';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilCafeteriaService } from '../../core/services/perfil-cafeteria.service';
import { TemaService } from '../../core/services/tema.service';
import { formatearMesAnio, listar } from '../../shared/utils/formato';

const ZOOM_PERFIL = 14;

@Component({
  selector: 'app-perfil-cafeteria',
  imports: [GoogleMap, MapAdvancedMarker, RouterLink],
  templateUrl: './perfil-cafeteria.component.html',
  styleUrl: './perfil-cafeteria.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PerfilCafeteriaComponent {
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly perfiles = inject(PerfilCafeteriaService);
  private readonly temas = inject(TemaService);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly tema = this.temas.tema;
  protected readonly logo = computed(() =>
    this.tema() === 'claro' ? '/images/logo-cranhua-negro.png' : '/images/logo-cranhua.png',
  );
  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });

  protected readonly perfil = computed(() => this.perfiles.obtener(this.id()));

  protected readonly iniciales = computed(() =>
    (this.perfil()?.nombre ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((palabra) => palabra[0].toUpperCase())
      .join(''),
  );

  protected readonly datos = computed(() => {
    const perfil = this.perfil();
    if (!perfil) {
      return [];
    }
    return [
      { etiqueta: 'Cafés con trazabilidad en el menú', valor: String(perfil.cafesTrazables) },
      {
        etiqueta: 'Tostadores con los que trabaja',
        valor: listar(perfil.tostadores.map((t) => t.nombre)),
      },
      { etiqueta: 'Horario', valor: perfil.horario },
      { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
    ];
  });

  protected readonly opcionesMapa = computed<google.maps.MapOptions>(() => ({
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'cooperative',
    backgroundColor: this.tema() === 'oscuro' ? '#10263b' : '#cfe0c8',
  }));

  protected readonly zoom = ZOOM_PERFIL;
  protected readonly pin = computed(() => this.crearPin(this.perfil()));

  protected establecerTema(tema: TemaDashboard): void {
    this.temas.establecerTema(tema);
  }

  private crearPin(perfil: PerfilCafeteria | null): HTMLElement {
    const pin = this.document.createElement('div');
    pin.className = 'pin-cafeteria';

    const icono = this.document.createElement('span');
    icono.className = 'pin-cafeteria__icono';
    icono.textContent = '📍';
    icono.setAttribute('aria-hidden', 'true');

    const etiqueta = this.document.createElement('span');
    etiqueta.className = 'pin-cafeteria__etiqueta';
    etiqueta.textContent = perfil?.ubicacion ?? '';

    pin.append(icono, etiqueta);
    return pin;
  }
}
