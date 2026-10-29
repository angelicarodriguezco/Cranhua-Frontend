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

export type Rol = 'cafetalero' | 'tostador' | 'cafeteria';

interface OpcionRol {
  valor: Rol;
  etiqueta: string;
  rutaOnboarding: string;
}

// Orden en que se recorren los onboardings cuando el usuario elige varios roles.
export const ROLES: OpcionRol[] = [
  { valor: 'cafetalero', etiqueta: 'Cafetalero', rutaOnboarding: '/onboarding-finca' },
  { valor: 'tostador', etiqueta: 'Tostador', rutaOnboarding: '/onboarding-tostador' },
  { valor: 'cafeteria', etiqueta: 'Cafetería', rutaOnboarding: '/onboarding-cafeteria' },
];

type CampoRegistro = 'roles' | 'nombre' | 'correo' | 'telefono' | 'contrasena';

function alMenosUnRol(control: AbstractControl<Rol[]>): ValidationErrors | null {
  return control.value.length > 0 ? null : { sinRol: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private readonly router = inject(Router);

  protected readonly roles = ROLES;
  protected readonly fotoPreview = signal<string | null>(null);
  protected readonly fotoNombre = signal<string | null>(null);

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
      validators: [Validators.required, Validators.minLength(8)],
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

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Sin backend todavía (CP3-18): solo se navega al onboarding del primer rol elegido.
    // Los demás roles viajan en el state para que ese onboarding continúe con ellos.
    const [primero, ...pendientes] = ROLES.filter((r) => this.estaSeleccionado(r.valor));
    void this.router.navigateByUrl(primero.rutaOnboarding, {
      state: {
        nombre: this.form.controls.nombre.value.trim(),
        rolesPendientes: pendientes.map((r) => r.valor),
      },
    });
  }
}
