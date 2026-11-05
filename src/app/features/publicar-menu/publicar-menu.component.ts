import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS_MENU, CategoriaMenu, ItemMenu } from '../../core/models/menu-cafeteria.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { MenuCafeteriaService } from '../../core/services/menu-cafeteria.service';
import { formatearColones } from '../../shared/utils/formato';
import { MenuLateralCafeteriaComponent } from '../dashboard-cafeteria/components/menu-lateral-cafeteria/menu-lateral-cafeteria.component';

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
  imports: [MenuLateralCafeteriaComponent, ReactiveFormsModule],
  templateUrl: './publicar-menu.component.html',
  styleUrl: './publicar-menu.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class PublicarMenuComponent {
  private readonly panel = inject(DashboardCafeteriaService);
  private readonly menuService = inject(MenuCafeteriaService);

  protected readonly perfilSidebar = this.panel.perfilSidebar;
  protected readonly tema = this.panel.tema;

  protected readonly categorias = CATEGORIAS_MENU;
  protected readonly formulario = crearFormularioItemMenu();
  protected readonly items = signal<ItemMenu[]>([]);
  protected readonly colones = formatearColones;

  constructor() {
    this.menuService.listar().subscribe((items) => this.items.set(items));
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

  protected publicar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nombre, categoria, codigoTrazabilidad, precio } = this.formulario.getRawValue();
    this.menuService
      .publicar({
        nombre: nombre.trim(),
        categoria,
        codigoTrazabilidad: codigoTrazabilidad.trim() || null,
        precio: precio!,
      })
      .subscribe((item) => {
        this.items.update((items) => [item, ...items]);
        this.cancelar();
      });
  }

  protected cancelar(): void {
    this.formulario.reset();
  }

  protected quitar(item: ItemMenu): void {
    this.menuService
      .quitar(item.id)
      .subscribe(() => this.items.update((items) => items.filter((i) => i.id !== item.id)));
  }
}
