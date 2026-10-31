import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CosechaService } from './cosecha.service';

describe('CosechaService', () => {
  let servicio: CosechaService;

  beforeEach(() => {
    servicio = TestBed.inject(CosechaService);
  });

  it('devuelve solo las cosechas de la finca pedida', async () => {
    const cosechas = await firstValueFrom(servicio.deFinca('f-la-esperanza'));
    expect(cosechas.length).toBe(2);
    expect(cosechas.every((c) => c.fincaId === 'f-la-esperanza')).toBeTrue();
  });

  it('devuelve una lista vacía si la finca no tiene cosechas', async () => {
    expect(await firstValueFrom(servicio.deFinca('f-el-tucan'))).toEqual([]);
  });
});
