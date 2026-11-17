import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Canton, CantonResponseApi, Coordenada } from '../models/finca.model';
import { distanciaKm } from '../../shared/utils/geo';

// Más lejos que esto de la cabecera más cercana se considera fuera del país
const DISTANCIA_MAXIMA_CANTON_KM = 25;

export type EstadoCatalogo = 'inactivo' | 'cargando' | 'listo' | 'error';

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

@Injectable({ providedIn: 'root' })
export class CantonService {
  private readonly http = inject(HttpClient);
  private readonly lista = signal<Canton[]>([]);
  private readonly estadoCatalogo = signal<EstadoCatalogo>('inactivo');

  readonly estado = this.estadoCatalogo.asReadonly();

  // Una sola petición por visita; solo se repite si la anterior falló
  cargar(): void {
    const estado = this.estadoCatalogo();
    if (estado === 'cargando' || estado === 'listo') {
      return;
    }
    this.estadoCatalogo.set('cargando');
    this.http.get<CantonResponseApi[]>(`${environment.apiUrl}/api/publico/cantones`).subscribe({
      next: (cantones) => {
        this.lista.set(
          cantones.map(({ nombre, provincia, zonaCafetalera, cabecera }) => ({
            nombre,
            provincia,
            zona: zonaCafetalera,
            cabecera,
          })),
        );
        this.estadoCatalogo.set('listo');
      },
      error: () => this.estadoCatalogo.set('error'),
    });
  }

  cantonDe(punto: Coordenada): Canton | null {
    let masCercano: Canton | null = null;
    let menorDistancia = DISTANCIA_MAXIMA_CANTON_KM;
    for (const canton of this.lista()) {
      const distancia = distanciaKm(punto, canton.cabecera);
      if (distancia < menorDistancia) {
        masCercano = canton;
        menorDistancia = distancia;
      }
    }
    return masCercano;
  }

  buscar(nombre: string): Canton | undefined {
    const buscado = normalizar(nombre);
    const cantones = this.lista();
    return (
      cantones.find((c) => normalizar(c.nombre) === buscado) ??
      cantones.find((c) => normalizar(c.nombre).startsWith(buscado))
    );
  }
}

// Para el inicializador de un componente: pide el catálogo si todavía no se cargó
export function injectCantones(): CantonService {
  const servicio = inject(CantonService);
  servicio.cargar();
  return servicio;
}
