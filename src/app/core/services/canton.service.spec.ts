import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CANTONES_DE_PRUEBA, URL_CANTONES } from '../testing/cantones-de-prueba';
import { CantonService } from './canton.service';

describe('CantonService', () => {
  let servicio: CantonService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CantonService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide el catálogo una sola vez aunque varias vistas lo carguen', () => {
    servicio.cargar();
    servicio.cargar();
    expect(servicio.estado()).toBe('cargando');

    http.expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
    servicio.cargar();

    expect(servicio.estado()).toBe('listo');
    http.expectNone(URL_CANTONES);
  });

  it('queda en error si el catálogo no responde y permite reintentar', () => {
    servicio.cargar();
    http.expectOne(URL_CANTONES).error(new ProgressEvent('error'));
    expect(servicio.estado()).toBe('error');
    expect(servicio.cantonDe({ lat: 9.9335, lng: -84.0775 })).toBeNull();

    servicio.cargar();
    http.expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
    expect(servicio.estado()).toBe('listo');
  });

  describe('con el catálogo cargado', () => {
    beforeEach(() => {
      servicio.cargar();
      http.expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
    });

    it('ubica el cantón más cercano al pin con su zona cafetalera', () => {
      expect(servicio.cantonDe({ lat: 9.66, lng: -84.03 })).toEqual({
        nombre: 'Tarrazú',
        provincia: 'San José',
        zona: 'Tarrazú',
        cabecera: { lat: 9.6575, lng: -84.0247 },
      });
      expect(servicio.cantonDe({ lat: 9.9335, lng: -84.0775 })?.nombre).toBe('San José');
    });

    it('no asigna cantón a un punto lejos de todos', () => {
      expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
    });

    it('busca cantones sin tildes', () => {
      expect(servicio.buscar('tarrazu')?.nombre).toBe('Tarrazú');
      expect(servicio.buscar('san ra')?.nombre).toBe('San Ramón');
      expect(servicio.buscar('Narnia')).toBeUndefined();
    });
  });
});
