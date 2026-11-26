import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { Coordenada, NegocioTueste } from '../../core/models/negocio-tueste.model';
import { injectCantones } from '../../core/services/canton.service';
import { NegocioTuesteService } from '../../core/services/negocio-tueste.service';
import { OnboardingRolesService } from '../../core/services/onboarding-roles.service';
import { SesionService } from '../../core/services/sesion.service';
import { mensajeDeError } from '../../core/utils/auth-error';
import { BienvenidaTostadorComponent } from './components/bienvenida-tostador/bienvenida-tostador.component';
import { ConfirmacionTostadorComponent } from './components/confirmacion-tostador/confirmacion-tostador.component';
import {
  FormularioNegocioComponent,
  crearFormularioNegocio,
} from './components/formulario-negocio/formulario-negocio.component';

type Paso = 'bienvenida' | 'formulario' | 'confirmacion';

const PASOS: Paso[] = ['bienvenida', 'formulario', 'confirmacion'];

export const RUTA_DASHBOARD_TOSTADOR = '/tostador/dashboard';

const ETIQUETA_SIGUIENTE_ROL = 'Continuar con el siguiente rol';
const ETIQUETA_DASHBOARD = 'Ir a mi dashboard';

function formatearTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '').slice(-8);
  return `+506 ${digitos.slice(0, 4)}-${digitos.slice(4)}`;
}

@Component({
  selector: 'app-onboarding-tostador',
  imports: [BienvenidaTostadorComponent, ConfirmacionTostadorComponent, FormularioNegocioComponent],
  templateUrl: './onboarding-tostador.component.html',
  styleUrl: './onboarding-tostador.component.css',
})
export class OnboardingTostadorComponent {
  private negocioService = inject(NegocioTuesteService);
  private readonly cantones = injectCantones();
  private readonly onboardingRoles = inject(OnboardingRolesService);
  private router = inject(Router);
  private location = inject(Location);

  protected readonly usuario = inject(SesionService).usuario;
  protected readonly pasos = PASOS;

  protected readonly paso = signal<Paso>('bienvenida');
  protected readonly indicePaso = computed(() => PASOS.indexOf(this.paso()));

  protected readonly formulario = crearFormularioNegocio();
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed(() => {
    const pin = this.pin();
    return pin ? this.cantones.cantonDe(pin) : null;
  });
  protected readonly intentoGuardar = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly registrado = signal<NegocioTueste | null>(null);
  private pinGuardado: Coordenada | null = null;

  protected volver(): void {
    switch (this.paso()) {
      case 'bienvenida':
        this.onboardingRoles.limpiar();
        this.location.back();
        break;
      case 'formulario':
        this.cancelar();
        break;
      case 'confirmacion':
        this.editar();
        break;
    }
  }

  protected empezar(): void {
    this.paso.set('formulario');
  }

  protected cancelar(): void {
    const registrado = this.registrado();
    if (!registrado) {
      this.paso.set('bienvenida');
      return;
    }
    // Al editar, cancelar descarta los cambios y vuelve al resumen
    this.cargar(registrado);
    this.paso.set('confirmacion');
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    const canton = this.canton();
    const pin = this.pin();
    if (this.formulario.invalid || !canton || this.guardando()) {
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
    this.guardando.set(true);
    this.error.set(null);
    const registrado = this.registrado();
    const peticion = registrado
      ? this.negocioService.actualizar(registrado.id, datos)
      : this.negocioService.registrar(datos);
    peticion.subscribe({
      next: (negocio) => {
        this.guardando.set(false);
        this.registrado.set(negocio);
        this.pinGuardado = pin;
        this.cargar(negocio);
        this.paso.set('confirmacion');
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected editar(): void {
    this.paso.set('formulario');
  }

  protected hayCadena(): boolean {
    return this.onboardingRoles.hayCadena();
  }

  protected progreso(): { actual: number; total: number } {
    return this.onboardingRoles.progreso();
  }

  protected etiquetaContinuar(): string {
    return this.onboardingRoles.siguienteRuta() ? ETIQUETA_SIGUIENTE_ROL : ETIQUETA_DASHBOARD;
  }

  protected irAlDashboard(): void {
    const destino = this.onboardingRoles.destinoTrasCompletar('tostador');
    this.onboardingRoles.completarRolActual();
    void this.router.navigateByUrl(destino);
  }

  private cargar(negocio: NegocioTueste): void {
    this.formulario.reset({
      nombre: negocio.nombre,
      descripcion: negocio.descripcion ?? '',
      contacto: negocio.contacto,
      telefono: negocio.telefono,
      correo: negocio.correo,
      estilos: negocio.estilos,
    });
    this.pin.set(this.pinGuardado);
    this.intentoGuardar.set(false);
    this.error.set(null);
  }
}
