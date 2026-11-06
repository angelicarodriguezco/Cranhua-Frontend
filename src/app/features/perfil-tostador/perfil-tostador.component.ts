import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { TemaDashboard } from '../../core/models/dashboard-cafetalero.model';
import { PerfilTostador } from '../../core/models/perfil-tostador.model';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilTostadorService } from '../../core/services/perfil-tostador.service';
import { TemaService } from '../../core/services/tema.service';
import { formatearKg, formatearMesAnio, listar } from '../../shared/utils/formato';

const ZOOM_PERFIL = 13;

@Component({
  selector: 'app-perfil-tostador',
  imports: [GoogleMap, MapAdvancedMarker, RouterLink],
  templateUrl: './perfil-tostador.component.html',
  styleUrl: './perfil-tostador.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PerfilTostadorComponent {
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly perfiles = inject(PerfilTostadorService);
  private readonly temas = inject(TemaService);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly tema = this.temas.tema;
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
    const [primero = '', ...resto] = perfil.estilosTueste;
    return [
      { etiqueta: 'Fincas con las que trabaja', valor: String(perfil.fincas.length) },
      {
        etiqueta: 'Estilos de tueste',
        valor: listar([primero, ...resto.map((e) => e.toLowerCase())]),
      },
      { etiqueta: 'Café tostado este año', valor: formatearKg(perfil.kgTostadosAnio) },
      { etiqueta: 'En Cránhua desde', valor: formatearMesAnio(perfil.miembroDesde) },
    ];
  });

  protected readonly idsFincas = computed(
    () =>
      this.perfil()
        ?.fincas.map((f) => f.id)
        .join(',') ?? '',
  );

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

  private crearPin(perfil: PerfilTostador | null): HTMLElement {
    const pin = this.document.createElement('div');
    pin.className = 'pin-tostador';

    const icono = this.document.createElement('span');
    icono.className = 'pin-tostador__icono';
    icono.textContent = '📍';
    icono.setAttribute('aria-hidden', 'true');

    const etiqueta = this.document.createElement('span');
    etiqueta.className = 'pin-tostador__etiqueta';
    etiqueta.textContent = perfil?.ubicacion ?? '';

    pin.append(icono, etiqueta);
    return pin;
  }
}
