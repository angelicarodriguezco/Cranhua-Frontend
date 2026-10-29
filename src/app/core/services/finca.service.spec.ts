import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { FINCAS_REGISTRADAS, USUARIO_ACTUAL } from '../mocks/finca.mock';
import { Coordenada, NuevaFinca } from '../models/finca.model';
import { FincaService } from './finca.service';

function nuevaFinca(perimetro: Coordenada[]): NuevaFinca {
  return {
    nombre: 'Finca de prueba',
    descripcion: null,
    zona: null,
    perimetro,
    ubicacion: perimetro[0],
    canton: null,
    areaHectareas: 1,
    propietarioId: USUARIO_ACTUAL.id,
    duenosAdicionales: [],
  };
}

const LEJOS_DE_TODO: Coordenada[] = [
  { lat: 9.7, lng: -84.1 },
  { lat: 9.7, lng: -84.099 },
  { lat: 9.701, lng: -84.099 },
];

describe('FincaService', () => {
  let servicio: FincaService;

  beforeEach(() => {
    servicio = TestBed.inject(FincaService);
  });

  it('rechaza un perímetro que se superpone con una finca registrada', async () => {
    const tucan = FINCAS_REGISTRADAS[0];
    const resultado = await firstValueFrom(servicio.registrar(nuevaFinca(tucan.perimetro)));
    expect(resultado).toEqual({ registrada: false, conflicto: tucan });
  });

  it('registra la finca y la toma en cuenta para las siguientes', async () => {
    const primera = await firstValueFrom(servicio.registrar(nuevaFinca(LEJOS_DE_TODO)));
    expect(primera.registrada).toBeTrue();

    const segunda = await firstValueFrom(servicio.registrar(nuevaFinca(LEJOS_DE_TODO)));
    expect(segunda.registrada).toBeFalse();
  });

  it('busca usuarios por correo sin importar mayúsculas', async () => {
    const usuario = await firstValueFrom(
      servicio.buscarUsuarioPorCorreo(' Maria.Jimenez@ejemplo.cr '),
    );
    expect(usuario?.nombre).toBe('María');
    expect(
      await firstValueFrom(servicio.buscarUsuarioPorCorreo('nadie@ejemplo.cr')),
    ).toBeUndefined();
  });

  it('ubica el cantón más cercano al pin', () => {
    expect(servicio.cantonDe({ lat: 9.66, lng: -84.03 })?.nombre).toBe('Tarrazú');
    expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
  });

  it('busca cantones sin tildes', () => {
    expect(servicio.buscarCanton('tarrazu')?.nombre).toBe('Tarrazú');
    expect(servicio.buscarCanton('san ra')?.nombre).toBe('San Ramón');
    expect(servicio.buscarCanton('Narnia')).toBeUndefined();
  });
});
