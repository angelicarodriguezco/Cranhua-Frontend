import {
  Component,
  computed,
  ElementRef,
  inject,
  linkedSignal,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of, startWith, switchMap, tap } from 'rxjs';

import {
  Canton,
  Coordenada,
  ESTILOS_TUESTE,
  EstiloTueste,
  NegocioTueste,
} from '../../core/models/negocio-tueste.model';
import { injectCantones } from '../../core/services/canton.service';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { NegocioTuesteService } from '../../core/services/negocio-tueste.service';
import { mensajeDeError } from '../../core/utils/auth-error';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MapaUbicacionComponent } from '../onboarding-tostador/components/mapa-ubicacion/mapa-ubicacion.component';
import {
  crearFormularioNegocio,
  FormularioNegocio,
} from '../onboarding-tostador/components/formulario-negocio/formulario-negocio.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';
import { EstadoCantonesComponent } from '../../shared/components/estado-cantones/estado-cantones.component';
import { ACCEPT_IMAGEN_PERFIL, validarImagenPerfil } from '../../shared/utils/imagen';

export const RUTA_ONBOARDING_TOSTADOR = '/onboarding-tostador';

export const DESCRIPCION_ELIMINAR_NEGOCIO =
  'Eliminar tu negocio borra su perfil público. Tu cuenta de Cránhua sigue activa.';

export const AVISO_ELIMINAR_NEGOCIO =
  'Eliminar tu negocio no borra los códigos de trazabilidad de los lotes que ya tostaste, pero ya no vas a poder editar tu información ni generar nuevos tuestes.';

export const ELIMINAR_NO_DISPONIBLE = 'Todavía no se puede eliminar el negocio desde acá.';

type Campo = keyof FormularioNegocio['controls'];
type Modo = 'vista' | 'edicion';

function formatearTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '').slice(-8);
  return `+506 ${digitos.slice(0, 4)}-${digitos.slice(4)}`;
}

export function inicialesNegocio(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '?';
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

@Component({
  selector: 'app-mi-negocio',
  imports: [
    EstadoCantonesComponent,
    MenuLateralComponent,
    ReactiveFormsModule,
    MapaUbicacionComponent,
    ZonaPeligroComponent,
    ModalConfirmacionComponent,
  ],
  templateUrl: './mi-negocio.component.html',
  styleUrl: './mi-negocio.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MiNegocioComponent implements OnDestroy {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly negocioService = inject(NegocioTuesteService);
  private readonly cantones = injectCantones();
  private readonly router = inject(Router);

  protected readonly tema = this.dashboard.tema;
  protected readonly estilos = ESTILOS_TUESTE;
  protected readonly descripcionEliminar = DESCRIPCION_ELIMINAR_NEGOCIO;
  protected readonly avisoEliminar = AVISO_ELIMINAR_NEGOCIO;
  protected readonly acceptImagen = ACCEPT_IMAGEN_PERFIL;

  protected readonly formulario = crearFormularioNegocio();
  protected readonly negocio = signal<NegocioTueste | null>(null);
  protected readonly cabecera = computed<Coordenada | null>(() => {
    const negocio = this.negocio();
    return negocio ? (this.cantones.buscar(negocio.canton.nombre)?.cabecera ?? null) : null;
  });
  // Se enlaza porque el catálogo de cantones puede llegar después que el negocio
  protected readonly pin = linkedSignal(() => this.cabecera());
  protected readonly canton = computed<Canton | null>(() => {
    const pin = this.pin();
    return pin ? this.cantones.cantonDe(pin) : null;
  });
  protected readonly textoUbicacion = computed(() => {
    const canton = this.canton();
    return canton ? `${canton.nombre}, ${canton.provincia}` : '';
  });

  protected readonly modo = signal<Modo>('vista');
  protected readonly noEncontrado = signal(false);
  protected readonly intentoGuardar = signal(false);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly portadaUrl = signal<string | null>(null);
  protected readonly errorPortada = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  private archivoPortada: File | null = null;
  private portadaObjectUrl: string | null = null;
  private readonly inputPortada = viewChild<ElementRef<HTMLInputElement>>('inputPortada');

  private readonly nombreActual = toSignal(
    this.formulario.controls.nombre.valueChanges.pipe(
      startWith(this.formulario.controls.nombre.value),
      map((nombre) => nombre.trim()),
    ),
    { initialValue: '' },
  );

  protected readonly iniciales = computed(() => {
    if (this.modo() === 'edicion') {
      return inicialesNegocio(this.nombreActual() || this.negocio()?.nombre || '');
    }
    return inicialesNegocio(this.negocio()?.nombre || '');
  });

  constructor() {
    this.negocioService.obtenerActual().subscribe({
      next: (negocio) => {
        if (!negocio) {
          this.noEncontrado.set(true);
          return;
        }
        this.aplicar(negocio);
      },
      error: (error: unknown) => this.error.set(mensajeDeError(error)),
    });
  }

  ngOnDestroy(): void {
    this.revocarPortadaObjectUrl();
  }

  protected invalido(campo: Campo): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected tieneError(campo: Campo, error: string): boolean {
    return this.invalido(campo) && this.formulario.controls[campo].hasError(error);
  }

  protected ubicacionInvalida(): boolean {
    return this.intentoGuardar() && !this.canton();
  }

  protected seleccionado(estilo: EstiloTueste): boolean {
    return this.formulario.controls.estilos.value.includes(estilo);
  }

  protected alternarEstilo(estilo: EstiloTueste): void {
    const control = this.formulario.controls.estilos;
    const quitar = control.value.includes(estilo);
    control.setValue(
      ESTILOS_TUESTE.filter((e) => (e === estilo ? !quitar : control.value.includes(e))),
    );
    control.markAsTouched();
  }

  protected editar(): void {
    const guardado = this.negocio();
    if (!guardado) {
      return;
    }
    this.aplicar(guardado);
    this.modo.set('edicion');
  }

  protected abrirSelectorPortada(): void {
    this.inputPortada()?.nativeElement.click();
  }

  protected alSeleccionarPortada(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) {
      return;
    }
    const error = validarImagenPerfil(archivo);
    this.errorPortada.set(error);
    if (error) {
      input.value = '';
      return;
    }
    this.revocarPortadaObjectUrl();
    this.archivoPortada = archivo;
    this.portadaObjectUrl = URL.createObjectURL(archivo);
    this.portadaUrl.set(this.portadaObjectUrl);
  }

  protected cancelar(): void {
    const guardado = this.negocio();
    if (!guardado) {
      return;
    }
    this.aplicar(guardado);
    this.modo.set('vista');
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    this.formulario.markAllAsTouched();
    const actual = this.negocio();
    const canton = this.canton();
    if (!actual || this.formulario.invalid || !canton || this.guardando()) {
      return;
    }

    const { nombre, descripcion, contacto, telefono, correo, estilos } =
      this.formulario.getRawValue();
    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      contacto: contacto.trim(),
      telefono: formatearTelefono(telefono),
      correo: correo.trim(),
      canton,
      estilos,
    };
    const portada = this.archivoPortada;

    this.guardando.set(true);
    this.error.set(null);
    this.negocioService
      .actualizar(actual.id, datos)
      .pipe(
        // Si después falla la portada, los datos ya quedaron guardados
        tap((negocio) => this.negocio.set(negocio)),
        switchMap((negocio) =>
          portada ? this.negocioService.actualizarPortada(negocio.id, portada) : of(negocio),
        ),
      )
      .subscribe({
        next: (negocio) => {
          this.guardando.set(false);
          this.aplicar(negocio);
          this.modo.set('vista');
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.error.set(mensajeDeError(error));
        },
      });
  }

  protected abrirModalEliminar(): void {
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  // El backend todavía no tiene endpoint para eliminar el negocio
  protected confirmarEliminar(): void {
    this.modalEliminarAbierto.set(false);
    this.error.set(ELIMINAR_NO_DISPONIBLE);
  }

  protected irAlRegistro(): void {
    void this.router.navigateByUrl(RUTA_ONBOARDING_TOSTADOR);
  }

  private aplicar(negocio: NegocioTueste): void {
    this.negocio.set(negocio);
    this.formulario.reset({
      nombre: negocio.nombre,
      descripcion: negocio.descripcion ?? '',
      contacto: negocio.contacto,
      telefono: negocio.telefono,
      correo: negocio.correo,
      estilos: negocio.estilos,
    });
    this.pin.set(this.cabecera());
    this.intentoGuardar.set(false);
    this.error.set(null);
    this.errorPortada.set(null);
    this.archivoPortada = null;
    this.revocarPortadaObjectUrl();
    this.portadaUrl.set(negocio.portadaUrl);
  }

  private revocarPortadaObjectUrl(): void {
    if (this.portadaObjectUrl) {
      URL.revokeObjectURL(this.portadaObjectUrl);
      this.portadaObjectUrl = null;
    }
  }
}
