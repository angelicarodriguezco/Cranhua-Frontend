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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, startWith } from 'rxjs';

import {
  CantonReferencia,
  ESTILOS_CAFE,
  EstiloCafe,
  Cafeteria,
} from '../../core/models/cafeteria.model';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { ModalConfirmacionComponent } from '../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { ZonaPeligroComponent } from '../../shared/components/zona-peligro/zona-peligro.component';
import { formatearTelefono } from '../../shared/utils/formato';
import { MenuLateralCafeteriaComponent } from '../dashboard-cafeteria/components/menu-lateral-cafeteria/menu-lateral-cafeteria.component';
import {
  crearFormularioDatos,
  FormularioDatos,
} from '../onboarding-cafeteria/components/datos-cafeteria/datos-cafeteria.component';
import { MapaCafeteriaComponent } from '../onboarding-cafeteria/components/mapa-cafeteria/mapa-cafeteria.component';

export const RUTA_DASHBOARD_CAFETERIA = '/cafeteria/dashboard';
export const RUTA_PUBLICAR_MENU = '/cafeteria/menu';

export const DESCRIPCION_ELIMINAR_CAFETERIA =
  'Eliminar tu cafetería borra su perfil público. Tu cuenta de Cránhua sigue activa.';

export const AVISO_ELIMINAR_CAFETERIA =
  'Esta cafetería ya vendió bebidas con código de trazabilidad visible para consumidores (por ejemplo CRH-2026-0103). Eliminar tu cafetería no borra esos códigos, pero ya no vas a poder editar tu menú ni recibir nuevos pedidos.';

type Campo = keyof FormularioDatos['controls'];

export function inicialesCafeteria(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '?';
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function clonarCafeteria(cafeteria: Cafeteria): Cafeteria {
  return {
    ...cafeteria,
    ubicacion: { ...cafeteria.ubicacion },
    canton: cafeteria.canton
      ? { ...cafeteria.canton, cabecera: { ...cafeteria.canton.cabecera } }
      : null,
    estilos: [...cafeteria.estilos],
  };
}

@Component({
  selector: 'app-mi-cafeteria',
  imports: [
    MenuLateralCafeteriaComponent,
    ReactiveFormsModule,
    MapaCafeteriaComponent,
    ZonaPeligroComponent,
    ModalConfirmacionComponent,
  ],
  templateUrl: './mi-cafeteria.component.html',
  styleUrl: './mi-cafeteria.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MiCafeteriaComponent implements OnDestroy {
  private readonly dashboard = inject(DashboardCafeteriaService);
  private readonly cafeteriaService = inject(CafeteriaService);
  private readonly router = inject(Router);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;
  protected readonly estilosDisponibles = ESTILOS_CAFE;
  protected readonly descripcionEliminar = DESCRIPCION_ELIMINAR_CAFETERIA;
  protected readonly avisoEliminar = AVISO_ELIMINAR_CAFETERIA;

  protected readonly formulario = crearFormularioDatos();
  protected readonly estilos = new FormControl<EstiloCafe[]>([], {
    nonNullable: true,
    validators: Validators.required,
  });

  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed<CantonReferencia | null>(() => {
    const pin = this.pin();
    return pin ? this.cafeteriaService.cantonDe(pin) : null;
  });
  protected readonly textoUbicacion = computed(() => {
    const canton = this.canton();
    return canton ? `${canton.nombre}, ${canton.provincia}` : '';
  });

  protected readonly cafeteria = signal<Cafeteria | null>(null);
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
    inicialesCafeteria(this.nombreActual() || this.cafeteria()?.nombre || ''),
  );

  constructor() {
    this.cafeteriaService.obtenerActual().subscribe((cafeteria) => {
      if (!cafeteria) {
        this.noEncontrado.set(true);
        return;
      }
      this.aplicar(cafeteria);
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

  protected estilosInvalidos(): boolean {
    return this.estilos.invalid && this.estilos.touched;
  }

  protected ubicacionInvalida(): boolean {
    return this.intentoGuardar() && !this.canton();
  }

  protected seleccionado(estilo: EstiloCafe): boolean {
    return this.estilos.value.includes(estilo);
  }

  protected alternarEstilo(estilo: EstiloCafe): void {
    const actuales = this.estilos.value;
    const quitar = actuales.includes(estilo);
    this.estilos.setValue(
      ESTILOS_CAFE.filter((e) => (e === estilo ? !quitar : actuales.includes(e))),
    );
    this.estilos.markAsTouched();
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
    const guardado = this.cafeteria();
    if (!guardado) {
      return;
    }
    this.aplicar(guardado);
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    this.formulario.markAllAsTouched();
    this.estilos.markAsTouched();
    const actual = this.cafeteria();
    const canton = this.canton();
    const pin = this.pin();
    if (!actual || this.formulario.invalid || this.estilos.invalid || !canton || !pin) {
      return;
    }

    const { nombre, descripcion, horario, contacto, telefono, correo } =
      this.formulario.getRawValue();
    const actualizado: Cafeteria = {
      id: actual.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      horario: horario.trim() || null,
      contacto: contacto.trim(),
      telefono: formatearTelefono(telefono),
      correo: correo.trim(),
      ubicacion: pin,
      canton,
      volumenMensual: actual.volumenMensual,
      estilos: [...this.estilos.value],
      propietarioId: actual.propietarioId,
      portadaUrl: this.portadaUrl(),
    };

    this.cafeteriaService.actualizar(actualizado).subscribe((cafeteria) => {
      this.aplicar(cafeteria);
    });
  }

  protected irAPublicarMenu(): void {
    void this.router.navigateByUrl(RUTA_PUBLICAR_MENU);
  }

  protected abrirModalEliminar(): void {
    this.modalEliminarAbierto.set(true);
  }

  protected cerrarModalEliminar(): void {
    this.modalEliminarAbierto.set(false);
  }

  protected confirmarEliminar(): void {
    const actual = this.cafeteria();
    if (!actual) {
      this.modalEliminarAbierto.set(false);
      return;
    }
    this.cafeteriaService.eliminar(actual.id).subscribe((ok) => {
      this.modalEliminarAbierto.set(false);
      if (ok) {
        void this.router.navigateByUrl(RUTA_DASHBOARD_CAFETERIA);
      }
    });
  }

  protected irAlDashboard(): void {
    void this.router.navigateByUrl(RUTA_DASHBOARD_CAFETERIA);
  }

  private aplicar(cafeteria: Cafeteria): void {
    const copia = clonarCafeteria(cafeteria);
    this.cafeteria.set(copia);
    this.noEncontrado.set(false);
    this.formulario.reset({
      nombre: copia.nombre,
      descripcion: copia.descripcion ?? '',
      horario: copia.horario ?? '',
      contacto: copia.contacto,
      telefono: copia.telefono,
      correo: copia.correo,
    });
    this.estilos.reset([...copia.estilos]);
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
