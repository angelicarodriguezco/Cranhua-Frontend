import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { contrasenaConLetraYNumero } from '../../shared/validators/contrasena.validator';

const OTP_LENGTH = 6;
const ESPERA_AUTH_MS = 15_000;
const MENSAJE_RESPUESTA_LENTA =
  'La respuesta tarda demasiado. Si te llegó el código, usá “Ya tengo el código”.';

export const MENSAJE_CONTRASENA_RESTABLECIDA =
  'Tu contraseña se cambió. Iniciá sesión con la nueva.';

function contrasenasCoinciden(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('nueva')?.value ?? '';
  const confirmacion = group.get('confirmacion')?.value ?? '';
  if (!nueva || !confirmacion) {
    return null;
  }
  return nueva === confirmacion ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css',
})
export class RecuperarContrasenaComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  protected readonly paso = signal<1 | 2 | 3>(1);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly otpError = signal<string | null>(null);
  protected readonly otpReenviado = signal(false);
  protected readonly errorContrasenaServidor = signal<string | null>(null);

  protected readonly formCorreo = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly otpDigits = Array.from(
    { length: OTP_LENGTH },
    () =>
      new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d$/)],
      }),
  );

  protected readonly formOtp = new FormGroup(
    Object.fromEntries(this.otpDigits.map((control, i) => [`d${i}`, control])),
  );

  protected readonly formContrasena = new FormGroup(
    {
      nueva: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          contrasenaConLetraYNumero,
        ],
      }),
      confirmacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: contrasenasCoinciden },
  );

  private get correo(): string {
    return this.formCorreo.controls.correo.value.trim();
  }

  private get codigo(): string {
    return this.otpDigits.map((control) => control.value).join('');
  }

  protected campoCorreoInvalido(): boolean {
    const control = this.formCorreo.controls.correo;
    return control.invalid && control.touched;
  }

  protected campoContrasenaInvalido(nombre: 'nueva' | 'confirmacion'): boolean {
    const control = this.formContrasena.controls[nombre];
    const delServidor = nombre === 'nueva' && !!this.errorContrasenaServidor();
    return (control.invalid || delServidor) && control.touched;
  }

  protected mensajeNuevaContrasena(): string {
    const control = this.formContrasena.controls.nueva;
    if (control.hasError('required')) {
      return 'Campo requerido';
    }
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      return 'Debe tener entre 8 y 72 caracteres';
    }
    if (control.hasError('letraYNumero')) {
      return 'Debe tener al menos una letra y un número';
    }
    return this.errorContrasenaServidor() ?? 'Contraseña inválida';
  }

  protected contrasenasNoCoinciden(): boolean {
    return (
      this.formContrasena.hasError('noCoinciden') &&
      this.formContrasena.controls.confirmacion.touched
    );
  }

  protected mandarOtp(): void {
    this.errorGeneral.set(null);
    if (this.formCorreo.invalid) {
      this.formCorreo.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.auth
      .solicitarRecuperacion({ correo: this.correo })
      .pipe(
        timeout(ESPERA_AUTH_MS),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => this.irAlPasoCodigo(),
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorGeneral.set(MENSAJE_RESPUESTA_LENTA);
            return;
          }
          const parseado = parsearErrorAuth(error);
          this.errorGeneral.set(parseado.errores?.['correo'] ?? parseado.mensaje);
        },
      });
  }

  protected irAlPasoCodigo(): void {
    this.errorGeneral.set(null);
    if (this.formCorreo.invalid) {
      this.formCorreo.markAllAsTouched();
      return;
    }

    this.enviando.set(false);
    this.limpiarOtp();
    this.otpError.set(null);
    this.otpReenviado.set(false);
    this.paso.set(2);
  }

  protected reenviarOtp(): void {
    this.otpError.set(null);
    this.otpReenviado.set(false);
    this.enviando.set(true);
    this.auth
      .solicitarRecuperacion({ correo: this.correo })
      .pipe(
        timeout(ESPERA_AUTH_MS),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.limpiarOtp();
          this.otpReenviado.set(true);
        },
        error: (error: unknown) => {
          this.otpError.set(
            error instanceof TimeoutError
              ? MENSAJE_RESPUESTA_LENTA
              : parsearErrorAuth(error).mensaje,
          );
        },
      });
  }

  protected onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const escrito = ((event as InputEvent).data ?? input.value).replace(/\D/g, '');
    if (escrito.length > 1) {
      this.llenarOtp(escrito);
      return;
    }

    const digit = escrito;
    this.otpDigits[index].setValue(digit, { emitEvent: false });
    this.otpDigits[index].markAsTouched();
    this.otpError.set(null);

    if (digit && index < OTP_LENGTH - 1) {
      this.focusOtp(index + 1);
    }
  }

  protected onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace') {
      return;
    }

    if (this.otpDigits[index].value) {
      this.otpDigits[index].setValue('');
      this.otpError.set(null);
      return;
    }

    if (index > 0) {
      event.preventDefault();
      this.otpDigits[index - 1].setValue('');
      this.focusOtp(index - 1);
      this.otpError.set(null);
    }
  }

  protected onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    this.llenarOtp(event.clipboardData?.getData('text') ?? '');
  }

  protected verificarCodigo(): void {
    this.otpReenviado.set(false);
    if (this.formOtp.invalid) {
      this.formOtp.markAllAsTouched();
      this.otpError.set('Ingresá los 6 dígitos del código');
      return;
    }

    this.otpError.set(null);
    this.enviando.set(true);
    this.auth
      .verificarCodigo({ correo: this.correo, codigo: this.codigo })
      .pipe(
        timeout(ESPERA_AUTH_MS),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          this.errorGeneral.set(null);
          this.paso.set(3);
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.otpError.set(MENSAJE_RESPUESTA_LENTA);
            return;
          }
          const parseado = parsearErrorAuth(error);
          this.otpError.set(parseado.errores?.['codigo'] ?? parseado.mensaje);
        },
      });
  }

  protected cambiarContrasena(): void {
    this.errorGeneral.set(null);
    this.errorContrasenaServidor.set(null);
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.auth
      .restablecerContrasena({
        correo: this.correo,
        codigo: this.codigo,
        contrasena: this.formContrasena.controls.nueva.value,
      })
      .pipe(
        timeout(ESPERA_AUTH_MS),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/iniciar-sesion', {
            state: { mensaje: MENSAJE_CONTRASENA_RESTABLECIDA },
          });
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.errorGeneral.set(MENSAJE_RESPUESTA_LENTA);
            return;
          }
          this.mostrarErrorRestablecer(error);
        },
      });
  }

  private mostrarErrorRestablecer(error: unknown): void {
    const parseado = parsearErrorAuth(error);
    const errorContrasena = parseado.errores?.['contrasena'];
    if (errorContrasena) {
      this.errorContrasenaServidor.set(errorContrasena);
      this.formContrasena.controls.nueva.markAsTouched();
      return;
    }

    const esErrorDeCodigo =
      error instanceof HttpErrorResponse &&
      error.status === 400 &&
      (!parseado.errores || 'codigo' in parseado.errores);
    if (esErrorDeCodigo) {
      this.limpiarOtp();
      this.otpError.set(parseado.errores?.['codigo'] ?? parseado.mensaje);
      this.paso.set(2);
      return;
    }

    this.errorGeneral.set(parseado.mensaje);
  }

  private llenarOtp(texto: string): void {
    const digitos = texto.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digitos) {
      return;
    }

    for (let i = 0; i < OTP_LENGTH; i++) {
      this.otpDigits[i].setValue(digitos[i] ?? '');
      this.otpDigits[i].markAsTouched();
    }
    this.otpError.set(null);
    this.focusOtp(Math.min(digitos.length, OTP_LENGTH - 1));
  }

  private limpiarOtp(): void {
    for (const control of this.otpDigits) {
      control.reset('');
    }
  }

  private focusOtp(index: number): void {
    const inputs = this.otpInputs();
    inputs[index]?.nativeElement.focus();
  }
}
