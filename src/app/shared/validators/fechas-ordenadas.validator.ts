import { AbstractControl, ValidationErrors } from '@angular/forms';

export function fechasOrdenadasValidator(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fechaInicio')?.value;
  const fin = group.get('fechaFin')?.value;
  if (!inicio || !fin) {
    return null;
  }
  return fin >= inicio ? null : { fechasInconsistentes: true };
}
