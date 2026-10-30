import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { sumaPorcentajesValidator } from './suma-porcentajes.validator';

function arrayProcesos(
  filas: { proceso: string; porcentaje: number | null }[],
): FormArray {
  return new FormArray(
    filas.map(
      (fila) =>
        new FormGroup({
          proceso: new FormControl(fila.proceso, { nonNullable: true }),
          porcentaje: new FormControl(fila.porcentaje),
        }),
    ),
    { validators: [sumaPorcentajesValidator] },
  );
}

describe('sumaPorcentajesValidator', () => {
  it('es válido cuando la suma es 100', () => {
    const procesos = arrayProcesos([
      { proceso: 'Honey', porcentaje: 60 },
      { proceso: 'Lavado', porcentaje: 40 },
    ]);

    expect(procesos.valid).toBe(true);
    expect(procesos.errors).toBeNull();
  });

  it('es inválido cuando la suma es menor a 100', () => {
    const procesos = arrayProcesos([
      { proceso: 'Honey', porcentaje: 30 },
      { proceso: 'Natural', porcentaje: 20 },
    ]);

    expect(procesos.valid).toBe(false);
    expect(procesos.errors).toEqual({
      sumaPorcentajes: { suma: 50, esperado: 100 },
    });
  });

  it('es inválido cuando la suma supera 100', () => {
    const procesos = arrayProcesos([{ proceso: 'Honey', porcentaje: 120 }]);

    expect(procesos.valid).toBe(false);
    expect(procesos.errors).toEqual({
      sumaPorcentajes: { suma: 120, esperado: 100 },
    });
  });

  it('trata valores no numéricos como 0', () => {
    const procesos = arrayProcesos([
      { proceso: 'Honey', porcentaje: null },
      { proceso: 'Lavado', porcentaje: 100 },
    ]);

    expect(procesos.valid).toBe(true);
  });

  it('no aplica a controles que no son FormArray', () => {
    const control = new FormControl(50);
    expect(sumaPorcentajesValidator(control)).toBeNull();
  });
});
