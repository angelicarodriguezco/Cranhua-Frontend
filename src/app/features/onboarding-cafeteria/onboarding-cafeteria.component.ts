import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Cafeteria } from '../../core/models/cafeteria.model';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { SesionService } from '../../core/services/sesion.service';
import { BienvenidaCafeteriaComponent } from './components/bienvenida-cafeteria/bienvenida-cafeteria.component';
import { ConfirmacionCafeteriaComponent } from './components/confirmacion-cafeteria/confirmacion-cafeteria.component';
import {
  DatosCafeteriaComponent,
  crearFormularioDatos,
} from './components/datos-cafeteria/datos-cafeteria.component';
import {
  PreferenciasCafeteriaComponent,
  crearFormularioPreferencias,
} from './components/preferencias-cafeteria/preferencias-cafeteria.component';

type Paso = 'bienvenida' | 'datos' | 'preferencias' | 'confirmacion';

const PASOS: Paso[] = ['bienvenida', 'datos', 'preferencias', 'confirmacion'];

const ERROR_REGISTRO = 'No pudimos registrar la cafetería. Intentá de nuevo.';

export const RUTA_DASHBOARD = '/cafeteria/dashboard';

@Component({
  selector: 'app-onboarding-cafeteria',
  imports: [
    BienvenidaCafeteriaComponent,
    ConfirmacionCafeteriaComponent,
    DatosCafeteriaComponent,
    PreferenciasCafeteriaComponent,
  ],
  templateUrl: './onboarding-cafeteria.component.html',
  styleUrl: './onboarding-cafeteria.component.css',
})
export class OnboardingCafeteriaComponent {
  private cafeteriaService = inject(CafeteriaService);
  private router = inject(Router);

  protected readonly usuario = inject(SesionService).usuario;
  protected readonly pasos = PASOS;

  protected readonly paso = signal<Paso>('bienvenida');
  protected readonly indicePaso = computed(() => PASOS.indexOf(this.paso()));

  protected readonly formularioDatos = crearFormularioDatos();
  protected readonly formularioPreferencias = crearFormularioPreferencias();
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed(() => {
    const pin = this.pin();
    return pin ? this.cafeteriaService.cantonDe(pin) : null;
  });
  protected readonly intentoContinuar = signal(false);
  protected readonly guardando = signal(false);
  protected readonly erroresServidor = signal<string[]>([]);

  protected readonly registrada = signal<Cafeteria | null>(null);

  protected continuar(): void {
    this.intentoContinuar.set(true);
    if (this.formularioDatos.valid && this.pin() && this.canton()) {
      this.erroresServidor.set([]);
      this.paso.set('preferencias');
    }
  }

  protected guardar(): void {
    const pin = this.pin();
    const canton = this.canton();
    const { volumenMensual, estilos } = this.formularioPreferencias.getRawValue();
    if (
      this.formularioPreferencias.invalid ||
      !volumenMensual ||
      !pin ||
      !canton ||
      this.guardando()
    ) {
      return;
    }
    this.guardando.set(true);
    this.erroresServidor.set([]);
    const { nombre, contacto, telefono, correo, descripcion, horario } =
      this.formularioDatos.getRawValue();
    const datos = {
      nombre: nombre.trim(),
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      descripcion: descripcion.trim() || null,
      horario: horario.trim() || null,
      ubicacion: pin,
      canton,
      volumenMensual,
      estilos,
      propietarioId: this.usuario()!.id,
    };
    const registrada = this.registrada();
    const peticion = registrada
      ? this.cafeteriaService.actualizar({
          ...datos,
          id: registrada.id,
          portadaUrl: registrada.portadaUrl,
        })
      : this.cafeteriaService.registrar(datos);
    peticion.subscribe({
      next: (cafeteria) => {
        this.guardando.set(false);
        this.registrada.set(cafeteria);
        this.paso.set('confirmacion');
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        const cuerpo = error.error as
          | { mensaje?: string; errores?: Record<string, string> }
          | null
          | undefined;
        const porCampo = Object.values(cuerpo?.errores ?? {});
        this.erroresServidor.set(porCampo.length ? porCampo : [cuerpo?.mensaje ?? ERROR_REGISTRO]);
      },
    });
  }

  protected irAlDashboard(): void {
    this.router.navigateByUrl(RUTA_DASHBOARD);
  }
}
