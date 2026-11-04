import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  PerfilUsuario,
  RedSocial,
  TIPOS_RED_SOCIAL,
  TipoRedSocial,
} from '../../core/models/perfil.model';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { PerfilService } from '../../core/services/perfil.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MenuLateralCafetaleroComponent } from '../dashboard-cafetalero/components/menu-lateral-cafetalero/menu-lateral-cafetalero.component';

// Mismos patrones que onboarding-cafeteria (allá no están exportados)
const TELEFONO = /^(\+506[\s-]?)?\d{4}[\s-]?\d{4}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DESCRIPCION_ELIMINAR_CUENTA =
  'Al eliminar tu cuenta se borran permanentemente tu perfil y tu acceso a Crán̈hua. Las fincas y cosechas ya publicadas se conservan de forma anónima para no romper la trazabilidad de otros usuarios.';

export const NOMBRES_RED_SOCIAL: Record<TipoRedSocial, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  sitio: 'Sitio web',
};

const PLACEHOLDERS_RED_SOCIAL: Record<TipoRedSocial, string> = {
  instagram: '@tuusuario',
  whatsapp: '+506 0000-0000',
  facebook: 'facebook.com/tupagina',
  sitio: 'https://tusitio.cr',
};

type Modo = 'vista' | 'paso1' | 'paso2';

type Campo = keyof ReturnType<typeof crearFormularioPerfil>['controls'];

interface MensajeContrasena {
  tipo: 'exito' | 'error';
  texto: string;
}

function obligatorio(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function crearFormularioPerfil() {
  return new FormGroup({
    nombreCompleto: new FormControl('', {
      nonNullable: true,
      validators: [obligatorio, Validators.maxLength(80)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(CORREO)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TELEFONO)],
    }),
    ubicacion: new FormControl('', {
      nonNullable: true,
      validators: [obligatorio, Validators.maxLength(120)],
    }),
    biografia: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
  });
}

export function inicialesPerfil(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '?';
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export function enlaceRedSocial(red: RedSocial): string {
  const valor = red.valor.trim();
  switch (red.tipo) {
    case 'instagram':
      return `https://instagram.com/${valor.replace(/^@/, '')}`;
    case 'whatsapp': {
      const digitos = valor.replace(/\D/g, '');
      return `https://wa.me/${digitos.length === 8 ? '506' + digitos : digitos}`;
    }
    case 'facebook':
      if (/^https?:\/\//.test(valor)) {
        return valor;
      }
      return valor.includes('facebook.com') ? `https://${valor}` : `https://facebook.com/${valor}`;
    case 'sitio':
      return /^https?:\/\//.test(valor) ? valor : `https://${valor}`;
  }
}

@Component({
  selector: 'app-perfil-usuario',
  imports: [
    MenuLateralCafetaleroComponent,
    ReactiveFormsModule,
    NgTemplateOutlet,
    ZonaPeligroComponent,
    ModalConfirmacionComponent,
  ],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: [
    './perfil-usuario.tema.css',
    './perfil-usuario.component.css',
    './perfil-usuario.edicion.css',
  ],
  host: { '[attr.data-theme]': 'tema()' },
})
export class PerfilUsuarioComponent implements OnDestroy {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly perfilService = inject(PerfilService);
  private readonly router = inject(Router);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly descripcionEliminar = DESCRIPCION_ELIMINAR_CUENTA;
  protected readonly nombresRed = NOMBRES_RED_SOCIAL;
  protected readonly placeholdersRed = PLACEHOLDERS_RED_SOCIAL;
  protected readonly enlaceRed = enlaceRedSocial;

  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly modo = signal<Modo>('vista');

  protected readonly formulario = crearFormularioPerfil();
  protected readonly contrasena = new FormGroup({
    actual: new FormControl('', { nonNullable: true }),
    nueva: new FormControl('', { nonNullable: true }),
  });
  protected readonly mensajeContrasena = signal<MensajeContrasena | null>(null);

  protected readonly redes = signal<RedSocial[]>([]);
  protected readonly selectorRedAbierto = signal(false);
  protected readonly tiposDisponibles = computed(() =>
    TIPOS_RED_SOCIAL.filter((tipo) => !this.redes().some((r) => r.tipo === tipo)),
  );

  protected readonly portadaUrl = signal<string | null>(null);
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly modalEliminarAbierto = signal(false);

  protected readonly iniciales = computed(() =>
    inicialesPerfil(this.perfil()?.nombreCompleto ?? ''),
  );

  private readonly inputPortada = viewChild<ElementRef<HTMLInputElement>>('inputPortada');
  private readonly inputAvatar = viewChild<ElementRef<HTMLInputElement>>('inputAvatar');

  constructor() {
    this.perfilService.obtener().subscribe((perfil) => this.perfil.set(perfil));
  }

  ngOnDestroy(): void {
    this.descartarVistasPrevias();
  }

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }

  protected invalido(campo: Campo): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected tieneError(campo: Campo, error: string): boolean {
    return this.invalido(campo) && this.formulario.controls[campo].hasError(error);
  }

  protected editar(): void {
    const perfil = this.perfil();
    if (!perfil) {
      return;
    }
    this.formulario.reset({
      nombreCompleto: perfil.nombreCompleto,
      correo: perfil.correo,
      telefono: perfil.telefono,
      ubicacion: perfil.ubicacion,
      biografia: perfil.biografia,
    });
    this.redes.set(perfil.redes.map((r) => ({ ...r })));
    this.selectorRedAbierto.set(false);
    this.contrasena.reset();
    this.mensajeContrasena.set(null);
    this.portadaUrl.set(perfil.portadaUrl);
    this.avatarUrl.set(perfil.avatarUrl);
    this.modo.set('paso1');
  }

  protected siguiente(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }
    this.modo.set('paso2');
  }

  protected volverAlPaso1(): void {
    this.modo.set('paso1');
  }

  protected cancelar(): void {
    this.descartarVistasPrevias();
    this.modo.set('vista');
  }

  protected guardar(): void {
    const perfil = this.perfil();
    if (!perfil || this.formulario.invalid) {
      return;
    }
    const { nombreCompleto, correo, telefono, ubicacion, biografia } =
      this.formulario.getRawValue();
    const actualizado: PerfilUsuario = {
      ...perfil,
      nombreCompleto: nombreCompleto.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      ubicacion: ubicacion.trim(),
      biografia: biografia.trim(),
      redes: this.redes()
        .map((r) => ({ ...r, valor: r.valor.trim() }))
        .filter((r) => r.valor),
      portadaUrl: this.portadaUrl(),
      avatarUrl: this.avatarUrl(),
    };
    this.perfilService.actualizar(actualizado).subscribe((guardado) => {
      this.perfil.set(guardado);
      this.modo.set('vista');
    });
  }

  protected abrirSelectorRed(): void {
    this.selectorRedAbierto.update((abierto) => !abierto);
  }

  protected agregarRed(tipo: TipoRedSocial): void {
    if (this.redes().some((r) => r.tipo === tipo)) {
      return;
    }
    this.redes.update((lista) => [...lista, { tipo, valor: '' }]);
    this.selectorRedAbierto.set(false);
  }

  protected quitarRed(tipo: TipoRedSocial): void {
    this.redes.update((lista) => lista.filter((r) => r.tipo !== tipo));
  }

  protected cambiarRed(tipo: TipoRedSocial, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.redes.update((lista) => lista.map((r) => (r.tipo === tipo ? { ...r, valor } : r)));
  }

  protected actualizarContrasena(): void {
    const { actual, nueva } = this.contrasena.getRawValue();
    if (!actual || !nueva) {
      this.mensajeContrasena.set({
        tipo: 'error',
        texto: 'Completá la contraseña actual y la nueva.',
      });
    } else if (nueva.length < 8) {
      this.mensajeContrasena.set({
        tipo: 'error',
        texto: 'La nueva contraseña debe tener al menos 8 caracteres.',
      });
    } else if (nueva === actual) {
      this.mensajeContrasena.set({
        tipo: 'error',
        texto: 'La nueva contraseña tiene que ser distinta a la actual.',
      });
    } else {
      this.contrasena.reset();
      this.mensajeContrasena.set({ tipo: 'exito', texto: 'Tu contraseña se actualizó.' });
    }
  }

  protected abrirSelectorPortada(): void {
    this.inputPortada()?.nativeElement.click();
  }

  protected abrirSelectorAvatar(): void {
    this.inputAvatar()?.nativeElement.click();
  }

  protected alSeleccionarPortada(evento: Event): void {
    this.reemplazarVistaPrevia(this.portadaUrl, this.perfil()?.portadaUrl ?? null, evento);
  }

  protected alSeleccionarAvatar(evento: Event): void {
    this.reemplazarVistaPrevia(this.avatarUrl, this.perfil()?.avatarUrl ?? null, evento);
  }

  protected abrirModalEliminar(): void {
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected confirmarEliminar(): void {
    this.perfilService.eliminarCuenta().subscribe(() => {
      this.modalEliminarAbierto.set(false);
      void this.router.navigateByUrl('/');
    });
  }

  private reemplazarVistaPrevia(
    destino: WritableSignal<string | null>,
    guardada: string | null,
    evento: Event,
  ): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) {
      return;
    }
    const anterior = destino();
    if (anterior && anterior !== guardada) {
      URL.revokeObjectURL(anterior);
    }
    destino.set(URL.createObjectURL(archivo));
  }

  // Libera las imágenes elegidas que no llegaron a guardarse
  private descartarVistasPrevias(): void {
    const perfil = this.perfil();
    const portada = this.portadaUrl();
    const avatar = this.avatarUrl();
    if (portada && portada !== perfil?.portadaUrl) {
      URL.revokeObjectURL(portada);
    }
    if (avatar && avatar !== perfil?.avatarUrl) {
      URL.revokeObjectURL(avatar);
    }
    this.portadaUrl.set(perfil?.portadaUrl ?? null);
    this.avatarUrl.set(perfil?.avatarUrl ?? null);
  }
}
