import { Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import {
  ConflictoFinca,
  Coordenada,
  DuenoFallido,
  ErrorRegistroFinca,
  Finca,
} from '../../core/models/finca.model';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { listar } from '../../shared/utils/formato';
import { centroide, seCruzaConsigoMismo } from '../../shared/utils/geo';
import {
  DetallesFincaComponent,
  crearFormularioFinca,
} from './components/detalles-finca/detalles-finca.component';
import { MapaFincaComponent } from './components/mapa-finca/mapa-finca.component';
import { PasoBienvenidaComponent } from './components/paso-bienvenida/paso-bienvenida.component';
import { PasoConfirmacionComponent } from './components/paso-confirmacion/paso-confirmacion.component';

type Paso = 'bienvenida' | 'dibujo' | 'conflicto' | 'confirmacion';

const PASOS: Paso[] = ['bienvenida', 'dibujo', 'conflicto', 'confirmacion'];

export const RUTA_DASHBOARD = '/cafetalero/dashboard';

@Component({
  selector: 'app-onboarding-finca',
  imports: [
    DetallesFincaComponent,
    MapaFincaComponent,
    PasoBienvenidaComponent,
    PasoConfirmacionComponent,
  ],
  templateUrl: './onboarding-finca.component.html',
  styleUrl: './onboarding-finca.component.css',
})
export class OnboardingFincaComponent {
  private fincaService = inject(FincaService);
  private router = inject(Router);
  private location = inject(Location);

  protected readonly usuario = inject(SesionService).usuario;
  protected readonly pasos = PASOS;

  protected readonly paso = signal<Paso>('bienvenida');
  protected readonly indicePaso = computed(() => PASOS.indexOf(this.paso()));

  protected readonly perimetro = signal<Coordenada[]>([]);
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed(() => {
    const pin = this.pin();
    return pin ? this.fincaService.cantonDe(pin) : null;
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
  protected readonly duenosFallidos = signal<DuenoFallido[]>([]);

  protected readonly conflicto = signal<ConflictoFinca | null>(null);
  protected readonly conflictoPropio = computed(
    () => this.conflicto()?.duenos.some((d) => d.id === this.usuario().id) ?? false,
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
  }

  protected volver(): void {
    switch (this.paso()) {
      case 'bienvenida':
        this.location.back();
        break;
      case 'dibujo':
        this.paso.set('bienvenida');
        break;
      case 'conflicto':
        this.corregirDibujo();
        break;
      case 'confirmacion':
        this.irAlDashboard();
        break;
    }
  }

  protected empezar(): void {
    this.paso.set('dibujo');
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid || this.errorPerimetro() || this.guardando()) {
      return;
    }
    this.guardando.set(true);
    this.erroresServidor.set([]);
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
          this.guardando.set(false);
          if (resultado.registrada) {
            this.registrada.set(resultado.finca);
            this.duenosFallidos.set(resultado.duenosFallidos);
            this.paso.set('confirmacion');
          } else {
            this.conflicto.set(resultado.conflicto);
            this.avisoVisible.set(true);
            this.paso.set('conflicto');
          }
        },
        error: (error: ErrorRegistroFinca) => {
          this.guardando.set(false);
          const porCampo = Object.values(error.errores);
          this.erroresServidor.set(porCampo.length ? porCampo : [error.mensaje]);
        },
      });
  }

  // Solo se borra el polígono; el formulario, el pin y los dueños viven aquí y se conservan
  protected corregirDibujo(): void {
    this.perimetro.set([]);
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
    this.erroresServidor.set([]);
    this.intentoGuardar.set(false);
    this.registrada.set(null);
    this.paso.set('dibujo');
  }
}
