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

const OTP_MOCK = '123456';
const OTP_LENGTH = 6;

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
  private readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  protected readonly paso = signal<1 | 2 | 3>(1);
  protected readonly otpError = signal(false);
  protected readonly otpReenviado = signal(false);

  private otpSimulado = OTP_MOCK;

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
        validators: [Validators.required],
      }),
      confirmacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: contrasenasCoinciden },
  );

  protected campoCorreoInvalido(): boolean {
    const control = this.formCorreo.controls.correo;
    return control.invalid && control.touched;
  }

  protected campoContrasenaInvalido(nombre: 'nueva' | 'confirmacion'): boolean {
    const control = this.formContrasena.controls[nombre];
    return control.invalid && control.touched;
  }

  protected contrasenasNoCoinciden(): boolean {
    return (
      this.formContrasena.hasError('noCoinciden') &&
      this.formContrasena.controls.confirmacion.touched
    );
  }

  protected mandarOtp(): void {
    if (this.formCorreo.invalid) {
      this.formCorreo.markAllAsTouched();
      return;
    }

    this.generarOtpMock();
    this.limpiarOtp();
    this.otpError.set(false);
    this.otpReenviado.set(false);
    this.paso.set(2);
  }

  protected reenviarOtp(): void {
    this.generarOtpMock();
    this.limpiarOtp();
    this.otpError.set(false);
    this.otpReenviado.set(true);
  }

  protected onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index].setValue(digit, { emitEvent: false });
    this.otpDigits[index].markAsTouched();
    this.otpError.set(false);

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
      this.otpError.set(false);
      return;
    }

    if (index > 0) {
      event.preventDefault();
      this.otpDigits[index - 1].setValue('');
      this.focusOtp(index - 1);
      this.otpError.set(false);
    }
  }

  protected onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    for (let i = 0; i < OTP_LENGTH; i++) {
      this.otpDigits[i].setValue(pasted[i] ?? '');
      this.otpDigits[i].markAsTouched();
    }
    this.otpError.set(false);
    this.focusOtp(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  protected verificarCodigo(): void {
    if (this.formOtp.invalid) {
      this.formOtp.markAllAsTouched();
      this.otpError.set(true);
      return;
    }

    // Sin backend: cualquier OTP de 6 dígitos completo avanza al paso 3.
    this.otpError.set(false);
    this.paso.set(3);
  }

  protected cambiarContrasena(): void {
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }

    void this.router.navigateByUrl('/iniciar-sesion');
  }

  private generarOtpMock(): void {
    this.otpSimulado = OTP_MOCK;
    console.log('[recuperar-contrasena] OTP mock:', this.otpSimulado);
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
