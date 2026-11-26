import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  CambiosFinca,
  ConflictoFinca,
  Coordenada,
  DuenoFallido,
  ErrorRegistroFinca,
  Finca,
  ResultadoRegistro,
} from '../../core/models/finca.model';
import { injectCantones } from '../../core/services/canton.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { listar } from '../../shared/utils/formato';
import { centroide, seCruzaConsigoMismo } from '../../shared/utils/geo';
import { MapaFincaComponent } from '../onboarding-finca/components/mapa-finca/mapa-finca.component';
import { ConfirmacionFincaComponent } from './components/confirmacion-finca/confirmacion-finca.component';
import {
  FormularioFincaComponent,
  crearFormularioFinca,
} from './components/formulario-finca/formulario-finca.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_DASHBOARD = '/cafetalero/dashboard';

type Paso = 'dibujo' | 'conflicto' | 'confirmacion';

const CAMPOS_FORMULARIO = ['nombre', 'descripcion', 'zonaCafetalera'];
const ERROR_CARGA = 'No pudimos cargar la finca. Intentá de nuevo.';

function mismasCoordenadas(a: Coordenada[], b: Coordenada[]): boolean {
  return a.length === b.length && a.every((p, i) => p.lat === b[i].lat && p.lng === b[i].lng);
}

// Registro de una finca adicional desde el panel del cafetalero, y edición de una existente
// en cafetalero/fincas/:id/editar. Es una pantalla aparte del onboarding.
@Component({
  selector: 'app-registrar-finca',
  imports: [
    ConfirmacionFincaComponent,
    FormularioFincaComponent,
    MapaFincaComponent,
    MenuLateralComponent,
    RouterLink,
  ],
  templateUrl: './registrar-finca.component.html',
  styleUrl: './registrar-finca.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class RegistrarFincaComponent {
  private fincaService = inject(FincaService);
  private readonly cantones = injectCantones();
  private dashboard = inject(DashboardCafetaleroService);
  private router = inject(Router);
  private location = inject(Location);
  private injector = inject(Injector);
  private ruta = inject(ActivatedRoute);

  protected readonly fincaId = this.ruta.snapshot.paramMap.get('id');
  protected readonly modoEdicion = this.fincaId !== null;
  protected readonly original = signal<Finca | null>(null);
  protected readonly cargando = signal(this.modoEdicion);
  // 403, 404 o error al cargar: no hay formulario que mostrar
  protected readonly errorAcceso = signal<string | null>(null);
  private readonly mapaRef = viewChild('mapa', { read: ElementRef });

  protected readonly usuario = inject(SesionService).usuario;
  // El menú y el tema son los del dashboard, así el tema elegido se mantiene al navegar
  protected readonly tema = this.dashboard.tema;

  protected readonly paso = signal<Paso>('dibujo');

  protected readonly perimetro = signal<Coordenada[]>([]);
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed(() => {
    const pin = this.pin();
    return pin ? this.cantones.cantonDe(pin) : null;
  });
  protected readonly errorPerimetro = computed(() => {
    const perimetro = this.perimetro();
    if (perimetro.length < 3) {
      return 'Marcá al menos tres esquinas en el mapa.';
    }
    if (seCruzaConsigoMismo(perimetro)) {
      return 'Los lados del perímetro se cruzan entre sí. Arrastrá las esquinas para corregirlo.';
    }
    return null;
  });

  protected readonly formulario = crearFormularioFinca();
  protected readonly duenos = signal<string[]>([]);
  protected readonly intentoGuardar = signal(false);
  protected readonly guardando = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);
  protected readonly erroresCampo = signal<Record<string, string>>({});
  protected readonly duenosFallidos = signal<DuenoFallido[]>([]);

  protected readonly conflicto = signal<ConflictoFinca | null>(null);
  protected readonly conflictoPropio = computed(
    () => this.conflicto()?.duenos.some((d) => d.id === this.usuario()?.id) ?? false,
  );
  protected readonly nombresDuenos = computed(() =>
    listar(this.conflicto()?.duenos.map((d) => d.nombreCompleto) ?? []),
  );
  protected readonly avisoVisible = signal(false);
  protected readonly registrada = signal<Finca | null>(null);

  constructor() {
    // Sugiere la zona del cantón mientras el usuario no haya elegido una
    effect(() => {
      const canton = this.canton();
      const zona = this.formulario.controls.zona;
      if (canton && zona.pristine) {
        zona.setValue(canton.zona);
      }
    });

    if (this.fincaId) {
      this.cargar(this.fincaId);
    }
  }

  private cargar(id: string): void {
    this.fincaService.obtener(id).subscribe({
      next: (finca) => {
        this.original.set(finca);
        this.formulario.setValue({
          nombre: finca.nombre,
          descripcion: finca.descripcion ?? '',
          zona: finca.zona,
        });
        this.formulario.controls.zona.markAsDirty();
        this.perimetro.set(finca.perimetro);
        this.pin.set(finca.ubicacion);
        this.cargando.set(false);
        if (this.ruta.snapshot.queryParamMap.get('seccion') === 'perimetro') {
          afterNextRender(() => this.mapaRef()?.nativeElement.scrollIntoView({ block: 'start' }), {
            injector: this.injector,
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorAcceso.set(error.error?.mensaje ?? ERROR_CARGA);
      },
    });
  }

  protected volver(): void {
    if (this.paso() === 'conflicto') {
      this.corregirDibujo();
    } else {
      this.location.back();
    }
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid || this.errorPerimetro() || this.guardando()) {
      return;
    }
    const original = this.original();
    if (original) {
      this.guardarCambios(original);
      return;
    }
    this.guardando.set(true);
    this.limpiarErrores();
    const { nombre, descripcion, zona } = this.formulario.getRawValue();
    const perimetro = this.perimetro();
    this.fincaService
      .registrarConDuenos(
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          zona,
          perimetro,
          ubicacion: this.pin() ?? centroide(perimetro),
          canton: this.canton(),
        },
        this.duenos(),
      )
      .subscribe({
        next: (resultado) => {
          if (resultado.registrada) {
            this.guardando.set(false);
            this.registrada.set(resultado.finca);
            this.duenosFallidos.set(resultado.duenosFallidos);
            this.paso.set('confirmacion');
          } else {
            this.mostrarConflicto(resultado);
          }
        },
        error: (error: ErrorRegistroFinca) => this.mostrarErrores(error),
      });
  }

  private guardarCambios(original: Finca): void {
    const cambios = this.cambiosRespectoA(original);
    if (Object.keys(cambios).length === 0) {
      void this.router.navigate(['/cafetalero/fincas', original.id]);
      return;
    }
    this.guardando.set(true);
    this.limpiarErrores();
    this.fincaService.actualizar(original.id, cambios).subscribe({
      next: (resultado) => {
        if (resultado.registrada) {
          void this.router.navigate(['/cafetalero/fincas', original.id]);
        } else {
          this.mostrarConflicto(resultado);
        }
      },
      error: (error: ErrorRegistroFinca) => {
        if (error.estado === 403 || error.estado === 404) {
          this.guardando.set(false);
          this.errorAcceso.set(error.mensaje);
          return;
        }
        this.mostrarErrores(error);
      },
    });
  }

  // El backend no borra campos que vienen en null, así que la descripción vacía va como ''
  private cambiosRespectoA(original: Finca): CambiosFinca {
    const { nombre, descripcion, zona } = this.formulario.getRawValue();
    const perimetro = this.perimetro();
    const ubicacion = this.pin() ?? centroide(perimetro);
    const canton = this.canton();
    const cambios: CambiosFinca = {};
    if (nombre.trim() !== original.nombre) {
      cambios.nombre = nombre.trim();
    }
    if (descripcion.trim() !== (original.descripcion ?? '')) {
      cambios.descripcion = descripcion.trim();
    }
    if (zona !== original.zona && zona !== null) {
      cambios.zonaCafetalera = zona;
    }
    if (!mismasCoordenadas(perimetro, original.perimetro)) {
      cambios.perimetro = perimetro;
    }
    if (!mismasCoordenadas([ubicacion], [original.ubicacion])) {
      cambios.ubicacion = ubicacion;
      if (canton) {
        cambios.canton = canton.nombre;
        cambios.provincia = canton.provincia;
      }
    }
    return cambios;
  }

  private mostrarConflicto(resultado: Extract<ResultadoRegistro, { registrada: false }>): void {
    this.guardando.set(false);
    this.conflicto.set(resultado.conflicto);
    this.avisoVisible.set(true);
    this.paso.set('conflicto');
  }

  private mostrarErrores(error: ErrorRegistroFinca): void {
    this.guardando.set(false);
    const enCampo: Record<string, string> = {};
    const generales: string[] = [];
    for (const [campo, mensaje] of Object.entries(error.errores)) {
      if (CAMPOS_FORMULARIO.includes(campo)) {
        enCampo[campo] = mensaje;
      } else {
        generales.push(mensaje);
      }
    }
    this.erroresCampo.set(enCampo);
    this.erroresServidor.set(
      generales.length || Object.keys(enCampo).length ? generales : [error.mensaje],
    );
  }

  private limpiarErrores(): void {
    this.erroresServidor.set([]);
    this.erroresCampo.set({});
  }

  // Al registrar se borra solo el polígono; al editar se deja el dibujo para ajustarlo.
  // El formulario, el pin y los dueños viven aquí y se conservan.
  protected corregirDibujo(): void {
    if (!this.modoEdicion) {
      this.perimetro.set([]);
    }
    this.conflicto.set(null);
    this.avisoVisible.set(false);
    this.paso.set('dibujo');
  }

  protected irAlDashboard(): void {
    this.router.navigateByUrl(RUTA_DASHBOARD);
  }

  protected registrarOtra(): void {
    this.perimetro.set([]);
    this.pin.set(null);
    this.formulario.reset();
    this.duenos.set([]);
    this.duenosFallidos.set([]);
    this.limpiarErrores();
    this.intentoGuardar.set(false);
    this.registrada.set(null);
    this.paso.set('dibujo');
  }
}
