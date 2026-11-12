import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
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
import { Observable, concat, last } from 'rxjs';

import { ActualizarPerfilDatos, etiquetaRoles } from '../../core/mappers/cuenta.mapper';
import {
  PerfilUsuario,
  RedSocial,
  TIPOS_RED_SOCIAL,
  TipoRedSocial,
} from '../../core/models/perfil.model';
import { CuentaService } from '../../core/services/cuenta.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { PerfilService } from '../../core/services/perfil.service';
import { SesionService } from '../../core/services/sesion.service';
import { TemaService } from '../../core/services/tema.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';
import { ACCEPT_IMAGEN_PERFIL, validarImagenPerfil } from '../../shared/utils/imagen';

const TELEFONO = /^(\+506[\s-]?)?\d{4}[\s-]?\d{4}$/;

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

const INSTAGRAM = /^@?[\w.]{1,30}$/;
const ENLACE = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/;

type Modo = 'vista' | 'edicion';

type Campo = keyof ReturnType<typeof crearFormularioPerfil>['controls'];

function obligatorio(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function crearFormularioPerfil() {
  return new FormGroup({
    nombreCompleto: new FormControl('', {
      nonNullable: true,
      validators: [obligatorio, Validators.maxLength(80)],
    }),
    correo: new FormControl('', { nonNullable: true }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TELEFONO)],
    }),
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

export function validarRed(red: RedSocial): string | null {
  const valor = red.valor.trim();
  if (!valor) {
    return 'Completá el enlace o quitá esta red.';
  }
  switch (red.tipo) {
    case 'instagram':
      return INSTAGRAM.test(valor) ? null : 'Usá tu usuario de Instagram, ej. @tufinca.';
    case 'whatsapp':
      return TELEFONO.test(valor) ? null : 'Ingresá un número de 8 dígitos.';
    case 'facebook':
      return /^\S+$/.test(valor) ? null : 'Ingresá tu página de Facebook sin espacios.';
    case 'sitio':
      return ENLACE.test(valor) ? null : 'Ingresá un enlace válido, ej. https://tusitio.cr.';
  }
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
    MenuLateralComponent,
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
  private readonly temas = inject(TemaService);
  private readonly perfilService = inject(PerfilService);
  private readonly cuentaService = inject(CuentaService);
  private readonly sesionService = inject(SesionService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly tema = this.temas.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly descripcionEliminar = DESCRIPCION_ELIMINAR_CUENTA;
  protected readonly nombresRed = NOMBRES_RED_SOCIAL;
  protected readonly placeholdersRed = PLACEHOLDERS_RED_SOCIAL;
  protected readonly enlaceRed = enlaceRedSocial;
  protected readonly etiquetaRoles = etiquetaRoles;

  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly modo = signal<Modo>('vista');
  protected readonly intentoGuardar = signal(false);

  protected readonly formulario = crearFormularioPerfil();

  protected readonly redes = signal<RedSocial[]>([]);
  protected readonly selectorRedAbierto = signal(false);
  protected readonly tiposDisponibles = computed(() =>
    TIPOS_RED_SOCIAL.filter((tipo) => !this.redes().some((r) => r.tipo === tipo)),
  );

  protected readonly portadaUrl = signal<string | null>(null);
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly archivoPortada = signal<File | null>(null);
  protected readonly archivoAvatar = signal<File | null>(null);
  protected readonly errorPortada = signal<string | null>(null);
  protected readonly errorAvatar = signal<string | null>(null);
  protected readonly errorGuardar = signal<string | null>(null);
  protected readonly acceptImagen = ACCEPT_IMAGEN_PERFIL;
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
    this.temas.alternarTema();
  }

  protected errorRed(red: RedSocial): string | null {
    return this.intentoGuardar() ? validarRed(red) : null;
  }

  protected invalido(campo: Campo): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
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
    });
    this.redes.set(perfil.redes.map((r) => ({ ...r })));
    this.selectorRedAbierto.set(false);
    this.portadaUrl.set(perfil.portadaUrl);
    this.avatarUrl.set(perfil.avatarUrl);
    this.archivoPortada.set(null);
    this.archivoAvatar.set(null);
    this.errorPortada.set(null);
    this.errorAvatar.set(null);
    this.errorGuardar.set(null);
    this.intentoGuardar.set(false);
    this.modo.set('edicion');
  }

  protected cancelar(): void {
    this.descartarVistasPrevias();
    this.modo.set('vista');
  }

  protected guardar(): void {
    const perfil = this.perfil();
    if (!perfil) {
      return;
    }
    this.intentoGuardar.set(true);
    this.errorGuardar.set(null);
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.redes().some((r) => validarRed(r))) {
      afterNextRender(() => this.irAlPrimerError(), { injector: this.injector });
      return;
    }
    const { nombreCompleto, telefono } = this.formulario.getRawValue();
    const datos: ActualizarPerfilDatos = {
      nombreCompleto: nombreCompleto.trim(),
      telefono: telefono.trim(),
      redes: this.redes().map((r) => ({ ...r, valor: r.valor.trim() })),
    };
    const archivoAvatar = this.archivoAvatar();
    const archivoPortada = this.archivoPortada();
    const pasos: Observable<PerfilUsuario>[] = [];
    if (archivoAvatar) {
      pasos.push(this.perfilService.actualizarFoto(archivoAvatar));
    }
    if (archivoPortada) {
      pasos.push(this.perfilService.actualizarBanner(archivoPortada));
    }
    pasos.push(this.perfilService.actualizar(datos));

    concat(...pasos)
      .pipe(last())
      .subscribe({
        next: (guardado) => {
          this.limpiarArchivosLocales();
          this.perfil.set(guardado);
          this.modo.set('vista');
        },
        error: (error: unknown) => {
          this.errorGuardar.set(parsearErrorAuth(error).mensaje);
        },
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

  protected abrirSelectorPortada(): void {
    this.inputPortada()?.nativeElement.click();
  }

  protected abrirSelectorAvatar(): void {
    this.inputAvatar()?.nativeElement.click();
  }

  protected alSeleccionarPortada(evento: Event): void {
    this.reemplazarVistaPrevia(
      this.portadaUrl,
      this.archivoPortada,
      this.errorPortada,
      this.perfil()?.portadaUrl ?? null,
      evento,
    );
  }

  protected alSeleccionarAvatar(evento: Event): void {
    this.reemplazarVistaPrevia(
      this.avatarUrl,
      this.archivoAvatar,
      this.errorAvatar,
      this.perfil()?.avatarUrl ?? null,
      evento,
    );
  }

  protected abrirModalEliminar(): void {
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected confirmarEliminar(): void {
    this.perfilService.eliminarCuenta().subscribe(() => {
      this.cuentaService.limpiarCuenta();
      this.sesionService.cerrarSesion();
      this.modalEliminarAbierto.set(false);
      void this.router.navigateByUrl('/iniciar-sesion');
    });
  }

  private irAlPrimerError(): void {
    const campo = this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
    campo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    campo?.focus({ preventScroll: true });
  }

  private reemplazarVistaPrevia(
    destinoUrl: WritableSignal<string | null>,
    destinoArchivo: WritableSignal<File | null>,
    errorDestino: WritableSignal<string | null>,
    guardada: string | null,
    evento: Event,
  ): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) {
      return;
    }

    const error = validarImagenPerfil(archivo);
    if (error) {
      errorDestino.set(error);
      input.value = '';
      return;
    }

    errorDestino.set(null);
    const anterior = destinoUrl();
    if (anterior && anterior !== guardada) {
      URL.revokeObjectURL(anterior);
    }
    destinoArchivo.set(archivo);
    destinoUrl.set(URL.createObjectURL(archivo));
  }

  private limpiarArchivosLocales(): void {
    const perfil = this.perfil();
    const portada = this.portadaUrl();
    const avatar = this.avatarUrl();
    if (portada && portada !== perfil?.portadaUrl) {
      URL.revokeObjectURL(portada);
    }
    if (avatar && avatar !== perfil?.avatarUrl) {
      URL.revokeObjectURL(avatar);
    }
    this.archivoPortada.set(null);
    this.archivoAvatar.set(null);
    this.errorPortada.set(null);
    this.errorAvatar.set(null);
    this.errorGuardar.set(null);
  }

  private descartarVistasPrevias(): void {
    this.limpiarArchivosLocales();
    const perfil = this.perfil();
    this.portadaUrl.set(perfil?.portadaUrl ?? null);
    this.avatarUrl.set(perfil?.avatarUrl ?? null);
    const inputPortada = this.inputPortada()?.nativeElement;
    const inputAvatar = this.inputAvatar()?.nativeElement;
    if (inputPortada) {
      inputPortada.value = '';
    }
    if (inputAvatar) {
      inputAvatar.value = '';
    }
  }
}
