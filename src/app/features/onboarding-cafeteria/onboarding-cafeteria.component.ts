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

export const RUTA_DASHBOARD = '/dashboard';

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

  protected readonly registrada = signal<Cafeteria | null>(null);

  protected continuar(): void {
    this.intentoContinuar.set(true);
    if (this.formularioDatos.valid && this.pin()) {
      this.paso.set('preferencias');
    }
  }

  protected guardar(): void {
    const pin = this.pin();
    const { volumenMensual, estilos } = this.formularioPreferencias.getRawValue();
    if (this.formularioPreferencias.invalid || !volumenMensual || !pin) {
      return;
    }
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
      canton: this.canton(),
      volumenMensual,
      estilos,
      propietarioId: this.usuario().id,
    };
    const registrada = this.registrada();
    const peticion = registrada
      ? this.cafeteriaService.actualizar(registrada.id, datos)
      : this.cafeteriaService.registrar(datos);
    peticion.subscribe((cafeteria) => {
      this.registrada.set(cafeteria);
      this.paso.set('confirmacion');
    });
  }

  protected irAlDashboard(): void {
    this.router.navigateByUrl(RUTA_DASHBOARD);
  }
}
