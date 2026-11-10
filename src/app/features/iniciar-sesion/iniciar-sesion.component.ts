import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CuentaResponseApi, ROL_DESDE_API } from '../../core/models/auth.model';
import { RolCuenta } from '../../core/models/cuenta.model';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';

type CampoLogin = 'correo' | 'contrasena';

const CAMPO_API_A_FORM: Record<string, CampoLogin> = {
  correo: 'correo',
  contrasena: 'contrasena',
};

const RUTA_DASHBOARD_POR_ROL: Record<RolCuenta, string> = {
  cafetalero: '/cafetalero/dashboard',
  tostador: '/tostador/dashboard',
  cafeteria: '/cafeteria/dashboard',
};

@Component({
  selector: 'app-iniciar-sesion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './iniciar-sesion.component.html',
  styleUrl: './iniciar-sesion.component.css',
})
export class IniciarSesionComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);

  // Lo manda recuperar contraseña al terminar
  protected readonly mensajeExito = signal<string | null>(
    (this.router.getCurrentNavigation()?.extras.state?.['mensaje'] as string | undefined) ?? null,
  );
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresServidor = signal<Partial<Record<CampoLogin, string>>>({});

  protected readonly form = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected campoInvalido(nombre: CampoLogin): boolean {
    const control = this.form.controls[nombre];
    return (control.invalid || !!this.erroresServidor()[nombre]) && control.touched;
  }

  protected errorCampo(nombre: CampoLogin): string {
    const delServidor = this.erroresServidor()[nombre];
    if (delServidor) {
      return delServidor;
    }
    return 'Campo requerido';
  }

  protected enviar(): void {
    this.limpiarErrores();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.auth
      .iniciarSesion({
        correo: this.form.controls.correo.value.trim(),
        contrasena: this.form.controls.contrasena.value,
      })
      .subscribe({
        next: (cuenta) => {
          this.auth.aplicarSesion(cuenta);
          this.enviando.set(false);
          this.irAlDashboard(cuenta);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.mostrarErrorAuth(error);
        },
      });
  }

  protected async iniciarSesionConGoogle(): Promise<void> {
    this.limpiarErrores();
    this.enviando.set(true);
    try {
      const credencial = await this.googleIdentity.obtenerCredencial();
      this.auth.iniciarSesionConGoogle({ credencial }).subscribe({
        next: (cuenta) => {
          this.auth.aplicarSesion(cuenta);
          this.enviando.set(false);
          this.irAlDashboard(cuenta);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.mostrarErrorAuth(error);
        },
      });
    } catch (error: unknown) {
      this.enviando.set(false);
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudo completar el inicio de sesión con Google.';
      this.errorGeneral.set(mensaje);
    }
  }

  private irAlDashboard(cuenta: CuentaResponseApi): void {
    const primerRolApi = cuenta.roles[0];
    const rol = primerRolApi ? ROL_DESDE_API[primerRolApi] : 'cafetalero';
    void this.router.navigateByUrl(RUTA_DASHBOARD_POR_ROL[rol]);
  }

  private limpiarErrores(): void {
    this.errorGeneral.set(null);
    this.erroresServidor.set({});
  }

  private mostrarErrorAuth(error: unknown): void {
    const parseado = parsearErrorAuth(error);
    const mapeados: Partial<Record<CampoLogin, string>> = {};
    if (parseado.errores) {
      for (const [campoApi, mensaje] of Object.entries(parseado.errores)) {
        const campoForm = CAMPO_API_A_FORM[campoApi];
        if (campoForm) {
          mapeados[campoForm] = mensaje;
          this.form.controls[campoForm].markAsTouched();
        }
      }
    }
    this.erroresServidor.set(mapeados);

    if (Object.keys(mapeados).length === 0 || !parseado.errores) {
      this.errorGeneral.set(parseado.mensaje);
    } else if (parseado.mensaje && parseado.mensaje !== 'Revisá los datos ingresados.') {
      this.errorGeneral.set(parseado.mensaje);
    }
  }
}
