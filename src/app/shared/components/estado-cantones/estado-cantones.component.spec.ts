import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CantonService } from '../../../core/services/canton.service';
import { CANTONES_DE_PRUEBA, URL_CANTONES } from '../../../core/testing/cantones-de-prueba';
import { EstadoCantonesComponent } from './estado-cantones.component';

@Component({
  imports: [EstadoCantonesComponent],
  template: '<app-estado-cantones>Fuera del país</app-estado-cantones>',
})
class AnfitrionComponent {}

describe('EstadoCantonesComponent', () => {
  let fixture: ComponentFixture<AnfitrionComponent>;
  let http: HttpTestingController;

  const texto = () => {
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.trim();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AnfitrionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(CantonService).cargar();
    fixture = TestBed.createComponent(AnfitrionComponent);
  });

  afterEach(() => http.verify());

  it('avisa mientras el catálogo carga y luego muestra su contenido', () => {
    expect(texto()).toBe('Cargando cantones…');

    http.expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
    expect(texto()).toBe('Fuera del país');
  });

  it('muestra el error y reintenta la carga', () => {
    http.expectOne(URL_CANTONES).error(new ProgressEvent('error'));
    expect(texto()).toContain('No pudimos cargar los cantones.');

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(texto()).toBe('Cargando cantones…');
    http.expectOne(URL_CANTONES).flush(CANTONES_DE_PRUEBA);
    expect(texto()).toBe('Fuera del país');
  });
});
