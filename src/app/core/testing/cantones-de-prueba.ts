import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CantonResponseApi } from '../models/finca.model';

export const URL_CANTONES = `${environment.apiUrl}/api/publico/cantones`;

// Recorte del catálogo del backend con los cantones que usan los specs
export const CANTONES_DE_PRUEBA: CantonResponseApi[] = [
  {
    id: 101,
    nombre: 'San José',
    provincia: 'San José',
    zonaCafetalera: null,
    cabecera: { lat: 9.9326, lng: -84.0796 },
  },
  {
    id: 102,
    nombre: 'Escazú',
    provincia: 'San José',
    zonaCafetalera: null,
    cabecera: { lat: 9.9189, lng: -84.1397 },
  },
  {
    id: 105,
    nombre: 'Tarrazú',
    provincia: 'San José',
    zonaCafetalera: 'Tarrazú',
    cabecera: { lat: 9.6575, lng: -84.0247 },
  },
  {
    id: 113,
    nombre: 'Tibás',
    provincia: 'San José',
    zonaCafetalera: null,
    cabecera: { lat: 9.9586, lng: -84.0817 },
  },
  {
    id: 202,
    nombre: 'San Ramón',
    provincia: 'Alajuela',
    zonaCafetalera: 'Valle Occidental',
    cabecera: { lat: 10.087, lng: -84.47 },
  },
];

// Responde la petición del catálogo que dispara la vista al crearse
export function responderCantones(): void {
  TestBed.inject(HttpTestingController).expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
}
