import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { TOSTADOR_ACTUAL } from '../../core/mocks/negocio-tueste.mock';
import { Coordenada, NegocioTueste } from '../../core/models/negocio-tueste.model';
import { NegocioTuesteService } from '../../core/services/negocio-tueste.service';
import { BienvenidaTostadorComponent } from './components/bienvenida-tostador/bienvenida-tostador.component';
import { ConfirmacionTostadorComponent } from './components/confirmacion-tostador/confirmacion-tostador.component';
import {
  FormularioNegocioComponent,
  crearFormularioNegocio,
} from './components/formulario-negocio/formulario-negocio.component';

type Paso = 'bienvenida' | 'formulario' | 'confirmacion';

const PASOS: Paso[] = ['bienvenida', 'formulario', 'confirmacion'];

export const RUTA_DASHBOARD_TOSTADOR = '/tostador/dashboard';

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
  private router = inject(Router);
  private location = inject(Location);

  // Mientras no exista el login se usa el tostador de ejemplo
  protected readonly usuario = TOSTADOR_ACTUAL;
  protected readonly pasos = PASOS;

  protected readonly paso = signal<Paso>('bienvenida');
  protected readonly indicePaso = computed(() => PASOS.indexOf(this.paso()));

  protected readonly formulario = crearFormularioNegocio();
  protected readonly pin = signal<Coordenada | null>(null);
  protected readonly canton = computed(() => {
    const pin = this.pin();
    return pin ? this.negocioService.cantonDe(pin) : null;
  });
  protected readonly intentoGuardar = signal(false);

  protected readonly registrado = signal<NegocioTueste | null>(null);

  protected volver(): void {
    switch (this.paso()) {
      case 'bienvenida':
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
    if (this.formulario.invalid || !canton || !pin) {
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
      ubicacion: pin,
      canton,
      estilos,
      propietarioId: this.usuario.id,
    };
    const registrado = this.registrado();
    const guardado = registrado
      ? this.negocioService.actualizar({ ...datos, id: registrado.id })
      : this.negocioService.registrar(datos);
    guardado.subscribe((negocio) => {
      this.registrado.set(negocio);
      this.cargar(negocio);
      this.paso.set('confirmacion');
    });
  }

  protected editar(): void {
    this.paso.set('formulario');
  }

  protected irAlDashboard(): void {
    this.router.navigateByUrl(RUTA_DASHBOARD_TOSTADOR);
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
    this.pin.set(negocio.ubicacion);
    this.intentoGuardar.set(false);
  }
}
