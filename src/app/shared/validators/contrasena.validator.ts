import { AbstractControl, ValidationErrors } from '@angular/forms';

// Mismas reglas que @ContrasenaValida en el backend
export function contrasenaConLetraYNumero(
  control: AbstractControl<string>,
): ValidationErrors | null {
  return /^(?=.*\p{L})(?=.*\d).*$/u.test(control.value) ? null : { letraYNumero: true };
}
