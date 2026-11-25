import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS_MENU, CategoriaMenu, ItemMenu } from '../../core/models/menu-cafeteria.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { MenuCafeteriaService } from '../../core/services/menu-cafeteria.service';
import { mensajeDeError, parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearColones } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export function crearFormularioItemMenu() {
  return new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    categoria: new FormControl<CategoriaMenu>('Café', {
      nonNullable: true,
      validators: Validators.required,
    }),
    codigoTrazabilidad: new FormControl('', { nonNullable: true }),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
  });
}

export type FormularioItemMenu = ReturnType<typeof crearFormularioItemMenu>;

@Component({
  selector: 'app-publicar-menu',
  imports: [MenuLateralComponent, ReactiveFormsModule],
  templateUrl: './publicar-menu.component.html',
  styleUrl: './publicar-menu.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PublicarMenuComponent {
  private readonly panel = inject(DashboardCafeteriaService);
  private readonly menuService = inject(MenuCafeteriaService);

  protected readonly tema = this.panel.tema;

  protected readonly categorias = CATEGORIAS_MENU;
  protected readonly formulario = crearFormularioItemMenu();
  protected readonly items = signal<ItemMenu[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly publicando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly errorEnCampoCodigo = signal(false);
  protected readonly errorQuitar = signal<string | null>(null);
  protected readonly colones = formatearColones;

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.errorQuitar.set(null);
    this.menuService.listar().subscribe({
      next: (items) => {
        this.items.set(items);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.items.set([]);
        this.errorCarga.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected errorNombre(): string | null {
    const control = this.formulario.controls.nombre;
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Ingresá el nombre del ítem.';
    }
    if (control.hasError('maxlength')) {
      return 'El nombre puede tener hasta 80 caracteres.';
    }
    return null;
  }

  protected errorPrecio(): string | null {
    const control = this.formulario.controls.precio;
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Ingresá el precio.';
    }
    if (control.hasError('min')) {
      return 'El precio tiene que ser mayor que 0.';
    }
    return null;
  }

  protected errorCodigo(): string | null {
    return this.errorEnCampoCodigo() ? this.errorFormulario() : null;
  }

  protected publicar(): void {
    if (this.publicando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, categoria, codigoTrazabilidad, precio } = this.formulario.getRawValue();
    this.publicando.set(true);
    this.errorFormulario.set(null);
    this.errorEnCampoCodigo.set(false);

    this.menuService
      .publicar({
        nombre: nombre.trim(),
        categoria,
        codigoTrazabilidad: codigoTrazabilidad.trim() || null,
        precio: precio!,
      })
      .subscribe({
        next: (item) => {
          this.items.update((items) => [item, ...items]);
          this.publicando.set(false);
          this.cancelar();
        },
        error: (error: unknown) => {
          const mensaje = parsearErrorAuth(error).mensaje;
          const esCodigo =
            error instanceof HttpErrorResponse &&
            error.status === 404 &&
            !!codigoTrazabilidad.trim();
          this.errorFormulario.set(mensaje);
          this.errorEnCampoCodigo.set(esCodigo);
          this.publicando.set(false);
        },
      });
  }

  protected cancelar(): void {
    this.formulario.reset();
    this.errorFormulario.set(null);
    this.errorEnCampoCodigo.set(false);
  }

  protected quitar(item: ItemMenu): void {
    this.errorQuitar.set(null);
    this.menuService.quitar(item.id).subscribe({
      next: () => this.items.update((items) => items.filter((i) => i.id !== item.id)),
      error: (error: unknown) => this.errorQuitar.set(mensajeDeError(error)),
    });
  }
}
