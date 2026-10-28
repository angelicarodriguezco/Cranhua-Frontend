import { Component, computed, effect, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { Coordenada, Finca, Usuario } from '../../core/models/finca.model';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { areaHectareas, centroide, seCruzaConsigoMismo } from '../../shared/utils/geo';
import {
  DetallesFincaComponent,
  crearFormularioFinca,
} from './components/detalles-finca/detalles-finca.component';
import { MapaFincaComponent } from './components/mapa-finca/mapa-finca.component';
import { PasoBienvenidaComponent } from './components/paso-bienvenida/paso-bienvenida.component';
import { PasoConfirmacionComponent } from './components/paso-confirmacion/paso-confirmacion.component';

type Paso = 'bienvenida' | 'dibujo' | 'conflicto' | 'confirmacion';

const PASOS: Paso[] = ['bienvenida', 'dibujo', 'conflicto', 'confirmacion'];

export const RUTA_DASHBOARD = '/dashboard';

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
  protected readonly duenos = signal<Usuario[]>([]);
  protected readonly intentoGuardar = signal(false);

  protected readonly conflicto = signal<Finca | null>(null);
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
    if (this.formulario.invalid || this.errorPerimetro()) {
      return;
    }
    const { nombre, descripcion, zona } = this.formulario.getRawValue();
    const perimetro = this.perimetro();
    this.fincaService
      .registrar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        zona,
        perimetro,
        ubicacion: this.pin() ?? centroide(perimetro),
        canton: this.canton(),
        areaHectareas: areaHectareas(perimetro),
        propietarioId: this.usuario().id,
        duenosAdicionales: this.duenos(),
      })
      .subscribe((resultado) => {
        if (resultado.registrada) {
          this.registrada.set(resultado.finca);
          this.paso.set('confirmacion');
        } else {
          this.conflicto.set(resultado.conflicto);
          this.avisoVisible.set(true);
          this.paso.set('conflicto');
        }
      });
  }

  protected corregirDibujo(): void {
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
    this.intentoGuardar.set(false);
    this.registrada.set(null);
    this.paso.set('dibujo');
  }
}
