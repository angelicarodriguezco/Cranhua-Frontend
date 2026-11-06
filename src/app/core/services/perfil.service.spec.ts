import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PERFIL_EJEMPLO } from '../mocks/perfil.mock';
import { PerfilService } from './perfil.service';

describe('PerfilService', () => {
  let servicio: PerfilService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    servicio = TestBed.inject(PerfilService);
  });

  it('arranca con el perfil de ejemplo', async () => {
    const perfil = await firstValueFrom(servicio.obtener());
    expect(perfil?.nombreCompleto).toBe('Rodrigo Alvarado Castro');
    expect(perfil?.correo).toBe('rodrigo@fincalacatalina.cr');
    expect(perfil?.telefono).toBe('+506 8888-4321');
    expect(perfil?.miembroDesde).toBe(2024);
    expect(perfil?.redes.map((r) => r.tipo)).toEqual(['instagram', 'whatsapp']);
  });

  it('actualizar guarda el perfil y no comparte referencias con quien lo llama', async () => {
    const editado = { ...PERFIL_EJEMPLO, nombreCompleto: 'Rodrigo Alvarado', redes: [] };
    await firstValueFrom(servicio.actualizar(editado));
    editado.nombreCompleto = 'Otro';

    const perfil = await firstValueFrom(servicio.obtener());
    expect(perfil?.nombreCompleto).toBe('Rodrigo Alvarado');
    expect(perfil?.redes).toEqual([]);
  });

  it('eliminarCuenta borra el perfil y responde false si ya no existe', async () => {
    expect(await firstValueFrom(servicio.eliminarCuenta())).toBeTrue();
    expect(await firstValueFrom(servicio.obtener())).toBeNull();
    expect(await firstValueFrom(servicio.eliminarCuenta())).toBeFalse();
  });
});
