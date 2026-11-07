import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ROL_A_API } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';

export type Rol = 'cafetalero' | 'tostador' | 'cafeteria';

interface OpcionRol {
  valor: Rol;
  etiqueta: string;
  rutaOnboarding: string;
}

export const ROLES: OpcionRol[] = [
  { valor: 'cafetalero', etiqueta: 'Cafetalero', rutaOnboarding: '/onboarding-finca' },
  { valor: 'tostador', etiqueta: 'Tostador', rutaOnboarding: '/onboarding-tostador' },
  { valor: 'cafeteria', etiqueta: 'Cafetería', rutaOnboarding: '/onboarding-cafeteria' },
];

type CampoRegistro = 'roles' | 'nombre' | 'correo' | 'telefono' | 'contrasena';

const CAMPO_API_A_FORM: Record<string, CampoRegistro> = {
  roles: 'roles',
  nombreCompleto: 'nombre',
  correo: 'correo',
  telefono: 'telefono',
  contrasena: 'contrasena',
};

function alMenosUnRol(control: AbstractControl<Rol[]>): ValidationErrors | null {
  return control.value.length > 0 ? null : { sinRol: true };
}

function contrasenaConLetraYNumero(control: AbstractControl<string>): ValidationErrors | null {
  return /^(?=.*\p{L})(?=.*\d).*$/u.test(control.value) ? null : { letraYNumero: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);

  protected readonly roles = ROLES;
  protected readonly fotoPreview = signal<string | null>(null);
  protected readonly fotoNombre = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresServidor = signal<Partial<Record<CampoRegistro, string>>>({});

  protected readonly form = new FormGroup({
    roles: new FormControl<Rol[]>([], { nonNullable: true, validators: [alMenosUnRol] }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+?[\d\s-]{8,}$/)],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        contrasenaConLetraYNumero,
      ],
    }),
    instagram: new FormControl('', { nonNullable: true }),
    foto: new FormControl<File | null>(null),
  });

  protected estaSeleccionado(rol: Rol): boolean {
    return this.form.controls.roles.value.includes(rol);
  }

  protected alternarRol(rol: Rol): void {
    const control = this.form.controls.roles;
    const actuales = control.value;
    control.setValue(
      actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol],
    );
    control.markAsTouched();
  }

  protected alSeleccionarFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.form.controls.foto.setValue(archivo);

    const anterior = this.fotoPreview();
    if (anterior) {
      URL.revokeObjectURL(anterior);
    }
    this.fotoPreview.set(archivo ? URL.createObjectURL(archivo) : null);
    this.fotoNombre.set(archivo?.name ?? null);
  }

  protected campoInvalido(nombre: CampoRegistro): boolean {
    const control = this.form.controls[nombre];
    return control.invalid && control.touched;
  }

  protected errorServidor(nombre: CampoRegistro): string | null {
    return this.erroresServidor()[nombre] ?? null;
  }

  protected mensajeContrasena(): string {
    const control = this.form.controls.contrasena;
    if (control.hasError('required')) {
      return 'Ingresá una contraseña';
    }
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      return 'Debe tener entre 8 y 72 caracteres';
    }
    if (control.hasError('letraYNumero')) {
      return 'Debe tener al menos una letra y un número';
    }
    return 'Contraseña inválida';
  }

  protected enviar(): void {
    this.limpiarErrores();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rolesApi = this.form.controls.roles.value.map((rol) => ROL_A_API[rol]);
    const telefono = this.form.controls.telefono.value.trim();

    this.enviando.set(true);
    this.auth
      .registrar({
        nombreCompleto: this.form.controls.nombre.value.trim(),
        correo: this.form.controls.correo.value.trim(),
        contrasena: this.form.controls.contrasena.value,
        roles: rolesApi,
        ...(telefono ? { telefono } : {}),
      })
      .subscribe({
        next: (cuenta) => {
          this.auth.aplicarSesion(cuenta);
          this.enviando.set(false);
          this.irAlOnboarding(this.form.controls.nombre.value.trim());
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.mostrarErrorAuth(error);
        },
      });
  }

  protected async registrarConGoogle(): Promise<void> {
    this.limpiarErrores();
    const rolesControl = this.form.controls.roles;
    if (rolesControl.invalid) {
      rolesControl.markAsTouched();
      return;
    }

    this.enviando.set(true);
    try {
      const credencial = await this.googleIdentity.obtenerCredencial();
      this.auth
        .registrarConGoogle({
          credencial,
          roles: rolesControl.value.map((rol) => ROL_A_API[rol]),
        })
        .subscribe({
          next: (cuenta) => {
            this.auth.aplicarSesion(cuenta);
            this.enviando.set(false);
            this.irAlOnboarding(cuenta.nombreCompleto);
          },
          error: (error: unknown) => {
            this.enviando.set(false);
            this.mostrarErrorAuth(error);
          },
        });
    } catch (error: unknown) {
      this.enviando.set(false);
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo completar el registro con Google.';
      this.errorGeneral.set(mensaje);
    }
  }

  private irAlOnboarding(nombre: string): void {
    const [primero, ...pendientes] = ROLES.filter((r) => this.estaSeleccionado(r.valor));
    void this.router.navigateByUrl(primero.rutaOnboarding, {
      state: {
        nombre,
        rolesPendientes: pendientes.map((r) => r.valor),
      },
    });
  }

  private limpiarErrores(): void {
    this.errorGeneral.set(null);
    this.erroresServidor.set({});
  }

  private mostrarErrorAuth(error: unknown): void {
    const parseado = parsearErrorAuth(error);
    const mapeados: Partial<Record<CampoRegistro, string>> = {};
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
