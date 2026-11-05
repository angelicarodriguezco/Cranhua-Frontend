import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map, startWith } from 'rxjs';

import {
  Canton,
  Coordenada,
  ESTILOS_TUESTE,
  EstiloTueste,
  NegocioTueste,
} from '../../core/models/negocio-tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { NegocioTuesteService } from '../../core/services/negocio-tueste.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { MenuLateralTostadorComponent } from '../dashboard-tostador/components/menu-lateral-tostador/menu-lateral-tostador.component';
import { MapaUbicacionComponent } from '../onboarding-tostador/components/mapa-ubicacion/mapa-ubicacion.component';
import {
  crearFormularioNegocio,
  FormularioNegocio,
} from '../onboarding-tostador/components/formulario-negocio/formulario-negocio.component';

export const RUTA_DASHBOARD_TOSTADOR = '/tostador/dashboard';

export const DESCRIPCION_ELIMINAR_NEGOCIO =
  'Eliminar tu negocio borra su perfil público. Tu cuenta de Cránhua sigue activa.';

export const AVISO_ELIMINAR_NEGOCIO =
  'Ya tostaste lotes con código de trazabilidad visible para consumidores (por ejemplo CRH-2026-0103). Eliminar tu negocio no borra esos códigos, pero ya no vas a poder editar tu información ni generar nuevos tuestes.';

type Campo = keyof FormularioNegocio['controls'];

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

function clonarNegocio(negocio: NegocioTueste): NegocioTueste {
  return {
    ...negocio,
    ubicacion: { ...negocio.ubicacion },
    canton: { ...negocio.canton, cabecera: { ...negocio.canton.cabecera } },
    estilos: [...negocio.estilos],
  };
}

@Component({
  selector: 'app-mi-negocio',
  imports: [
    MenuLateralTostadorComponent,
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
  private readonly router = inject(Router);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;
  protected readonly estilos = ESTILOS_TUESTE;
  protected readonly descripcionEliminar = DESCRIPCION_ELIMINAR_NEGOCIO;
  protected readonly avisoEliminar = AVISO_ELIMINAR_NEGOCIO;

  protected readonly formulario = crearFormularioNegocio();
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed<Canton | null>(() => {
    const pin = this.pin();
    return pin ? this.negocioService.cantonDe(pin) : null;
  });
  protected readonly textoUbicacion = computed(() => {
    const canton = this.canton();
    return canton ? `${canton.nombre}, ${canton.provincia}` : '';
  });

  protected readonly negocio = signal<NegocioTueste | null>(null);
  protected readonly noEncontrado = signal(false);
  protected readonly intentoGuardar = signal(false);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly portadaUrl = signal<string | null>(null);

  private portadaObjectUrl: string | null = null;
  private readonly inputPortada = viewChild<ElementRef<HTMLInputElement>>('inputPortada');

  private readonly nombreActual = toSignal(
    this.formulario.controls.nombre.valueChanges.pipe(
      startWith(this.formulario.controls.nombre.value),
      map((nombre) => nombre.trim()),
    ),
    { initialValue: '' },
  );

  protected readonly iniciales = computed(() =>
    inicialesNegocio(this.nombreActual() || this.negocio()?.nombre || ''),
  );

  constructor() {
    this.negocioService.obtenerActual().subscribe((negocio) => {
      if (!negocio) {
        this.noEncontrado.set(true);
        return;
      }
      this.aplicar(negocio);
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

  protected abrirSelectorPortada(): void {
    this.inputPortada()?.nativeElement.click();
  }

  protected alSeleccionarPortada(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.revocarPortadaObjectUrl();
    if (!archivo) {
      return;
    }
    this.portadaObjectUrl = URL.createObjectURL(archivo);
    this.portadaUrl.set(this.portadaObjectUrl);
  }

  protected cancelar(): void {
    const guardado = this.negocio();
    if (!guardado) {
      return;
    }
    this.aplicar(guardado);
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    this.formulario.markAllAsTouched();
    const actual = this.negocio();
    const canton = this.canton();
    const pin = this.pin();
    if (!actual || this.formulario.invalid || !canton || !pin) {
      return;
    }

    const { nombre, descripcion, contacto, telefono, correo, estilos } =
      this.formulario.getRawValue();
    const actualizado: NegocioTueste = {
      id: actual.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      contacto: contacto.trim(),
      telefono: formatearTelefono(telefono),
      correo: correo.trim(),
      ubicacion: pin,
      canton,
      estilos,
      propietarioId: actual.propietarioId,
      portadaUrl: this.portadaUrl(),
    };

    this.negocioService.actualizar(actualizado).subscribe((negocio) => {
      this.aplicar(negocio);
    });
  }

  protected abrirModalEliminar(): void {
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected confirmarEliminar(): void {
    const actual = this.negocio();
    if (!actual) {
      this.modalEliminarAbierto.set(false);
      return;
    }
    this.negocioService.eliminar(actual.id).subscribe((ok) => {
      this.modalEliminarAbierto.set(false);
      if (ok) {
        void this.router.navigateByUrl(RUTA_DASHBOARD_TOSTADOR);
      }
    });
  }

  protected irAlDashboard(): void {
    void this.router.navigateByUrl(RUTA_DASHBOARD_TOSTADOR);
  }

  private aplicar(negocio: NegocioTueste): void {
    const copia = clonarNegocio(negocio);
    this.negocio.set(copia);
    this.noEncontrado.set(false);
    this.formulario.reset({
      nombre: copia.nombre,
      descripcion: copia.descripcion ?? '',
      contacto: copia.contacto,
      telefono: copia.telefono,
      correo: copia.correo,
      estilos: [...copia.estilos],
    });
    this.pin.set({ ...copia.ubicacion });
    this.intentoGuardar.set(false);
    this.revocarPortadaObjectUrl();
    this.portadaUrl.set(copia.portadaUrl ?? null);
  }

  private revocarPortadaObjectUrl(): void {
    if (this.portadaObjectUrl) {
      URL.revokeObjectURL(this.portadaObjectUrl);
      this.portadaObjectUrl = null;
    }
  }
}
