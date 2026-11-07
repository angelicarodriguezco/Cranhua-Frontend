import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CantonReferencia, ESTILOS_CAFE, EstiloCafe } from '../../core/models/cafeteria.model';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { formatearTelefono } from '../../shared/utils/formato';
import { RUTA_DASHBOARD_CAFETERIA } from '../mi-cafeteria/mi-cafeteria.component';
import {
  crearFormularioDatos,
  FormularioDatos,
} from '../onboarding-cafeteria/components/datos-cafeteria/datos-cafeteria.component';
import { MapaCafeteriaComponent } from '../onboarding-cafeteria/components/mapa-cafeteria/mapa-cafeteria.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

type Vista = 'vacia' | 'formulario';

type Campo = keyof FormularioDatos['controls'];

@Component({
  selector: 'app-registrar-cafeteria',
  imports: [MenuLateralComponent, ReactiveFormsModule, MapaCafeteriaComponent],
  templateUrl: './registrar-cafeteria.component.html',
  styleUrls: ['../mi-cafeteria/mi-cafeteria.component.css', './registrar-cafeteria.component.css'],
  host: { '[attr.data-theme]': 'tema()' },
})
export class RegistrarCafeteriaComponent {
  private readonly dashboard = inject(DashboardCafeteriaService);
  private readonly cafeteriaService = inject(CafeteriaService);
  private readonly router = inject(Router);

  // El rol del mock incluye el nombre del local, que ya no existe
  protected readonly tema = this.dashboard.tema;
  protected readonly estilosDisponibles = ESTILOS_CAFE;

  protected readonly vista = signal<Vista>('vacia');

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

  protected readonly intentoRegistrar = signal(false);

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
    return this.intentoRegistrar() && !this.canton();
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

  protected abrirFormulario(): void {
    this.vista.set('formulario');
  }

  protected cancelar(): void {
    this.formulario.reset();
    this.estilos.reset([]);
    this.pin.set(null);
    this.intentoRegistrar.set(false);
    this.vista.set('vacia');
  }

  protected registrar(): void {
    this.intentoRegistrar.set(true);
    this.formulario.markAllAsTouched();
    this.estilos.markAsTouched();
    const canton = this.canton();
    const pin = this.pin();
    if (this.formulario.invalid || this.estilos.invalid || !canton || !pin) {
      return;
    }

    const { nombre, descripcion, horario, contacto, telefono, correo } =
      this.formulario.getRawValue();
    this.cafeteriaService
      .registrarActual({
        nombre: nombre.trim(),
        contacto: contacto.trim(),
        telefono: formatearTelefono(telefono),
        correo: correo.trim(),
        descripcion: descripcion.trim() || null,
        horario: horario.trim() || null,
        ubicacion: pin,
        canton,
        volumenMensual: null,
        estilos: [...this.estilos.value],
        portadaUrl: null,
      })
      .subscribe(() => void this.router.navigateByUrl(RUTA_DASHBOARD_CAFETERIA));
  }
}
