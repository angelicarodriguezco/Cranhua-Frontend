import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PERFILES_FINCA_PUBLICO } from '../mocks/perfil-finca-publico.mock';
import { PerfilFincaPublicoService } from './perfil-finca-publico.service';

describe('PerfilFincaPublicoService', () => {
  let servicio: PerfilFincaPublicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(PerfilFincaPublicoService);
  });

  it('devuelve el perfil completo de Finca El Roble', async () => {
    const perfil = await firstValueFrom(servicio.obtener('finca-el-roble'));
    const esperado = PERFILES_FINCA_PUBLICO.find((f) => f.id === 'finca-el-roble');

    expect(perfil).toEqual(esperado);
    expect(perfil?.nombre).toBe('Finca El Roble');
    expect(perfil?.cosechaActiva).toEqual({
      id: 'cosecha-catuai-el-roble',
      codigo: 'CRH-2026-0103',
      variedad: 'Catuai',
      proceso: 'Honey',
      kilos: 290,
    });
    expect(perfil?.cafeterias.map((c) => c.rutaPerfil)).toContain(
      '/explorar/cafeteria/c-cafe-brumas',
    );
  });

  it('devuelve el stub de Finca La Catalina', async () => {
    const perfil = await firstValueFrom(servicio.obtener('finca-la-catalina'));

    expect(perfil?.id).toBe('finca-la-catalina');
    expect(perfil?.nombre).toBe('Finca La Catalina');
    expect(perfil?.ubicacionLabel).toContain('Tarrazú');
  });

  it('devuelve undefined para un id desconocido', async () => {
    expect(await firstValueFrom(servicio.obtener('finca-inexistente'))).toBeUndefined();
  });
});
