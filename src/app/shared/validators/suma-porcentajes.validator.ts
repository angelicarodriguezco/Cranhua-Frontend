import { AbstractControl, FormArray, ValidationErrors } from '@angular/forms';

export function sumaPorcentajesValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) {
    return null;
  }

  const suma = control.controls.reduce((acumulado, grupo) => {
    const crudo = grupo.get('porcentaje')?.value;
    const porcentaje = typeof crudo === 'number' ? crudo : Number(crudo);
    return acumulado + (Number.isFinite(porcentaje) ? porcentaje : 0);
  }, 0);

  return suma === 100 ? null : { sumaPorcentajes: { suma, esperado: 100 } };
}
