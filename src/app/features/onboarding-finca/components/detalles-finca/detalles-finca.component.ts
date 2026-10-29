import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Canton,
  Usuario,
  ZONAS_CAFETALERAS,
  ZonaCafetalera,
} from '../../../../core/models/finca.model';
import { FincaService } from '../../../../core/services/finca.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { iniciales, nombreCorto } from '../../../../shared/utils/formato';

export function crearFormularioFinca() {
  return new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
    zona: new FormControl<ZonaCafetalera | null>(null),
  });
}

export type FormularioFinca = ReturnType<typeof crearFormularioFinca>;

@Component({
  selector: 'app-detalles-finca',
  imports: [ReactiveFormsModule],
  templateUrl: './detalles-finca.component.html',
  styleUrl: './detalles-finca.component.css',
})
export class DetallesFincaComponent {
  private fincaService = inject(FincaService);
  private sesion = inject(SesionService);
  private injector = inject(Injector);

  readonly formulario = input.required<FormularioFinca>();
  readonly subtitulo = input<string | null>(null);
  readonly canton = input<Canton | null>(null);
  readonly hayPin = input(false);
  /** Error del perímetro; se muestra solo después de intentar guardar. */
  readonly errorPerimetro = input<string | null>(null);
  readonly intentoGuardar = input(false);
  readonly duenos = model<Usuario[]>([]);
  readonly guardar = output();

  protected readonly zonas = ZONAS_CAFETALERAS;
  protected readonly iniciales = iniciales;
  protected readonly nombreCorto = nombreCorto;

  protected readonly agregandoDueno = signal(false);
  protected readonly correoDueno = new FormControl('', { nonNullable: true });
  protected readonly errorDueno = signal<string | null>(null);
  private readonly campoCorreo = viewChild<ElementRef<HTMLInputElement>>('campoCorreo');

  protected nombreInvalido(): boolean {
    const nombre = this.formulario().controls.nombre;
    return nombre.invalid && nombre.touched;
  }

  protected mostrarCampoDueno(): void {
    this.agregandoDueno.set(true);
    this.errorDueno.set(null);
    afterNextRender(() => this.campoCorreo()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancelarDueno(): void {
    this.agregandoDueno.set(false);
    this.correoDueno.reset();
    this.errorDueno.set(null);
  }

  protected agregarDueno(): void {
    const correo = this.correoDueno.value.trim();
    if (Validators.email(this.correoDueno) || !correo) {
      this.errorDueno.set('Ingresá un correo válido.');
      return;
    }
    this.fincaService.buscarUsuarioPorCorreo(correo).subscribe((usuario) => {
      if (!usuario) {
        this.errorDueno.set('No hay ninguna cuenta de Crán̈hua con ese correo.');
      } else if (usuario.id === this.sesion.usuario().id) {
        this.errorDueno.set('Vos ya sos el dueño principal de esta finca.');
      } else if (this.duenos().some((d) => d.id === usuario.id)) {
        this.errorDueno.set(`${nombreCorto(usuario)} ya está en la lista.`);
      } else {
        this.duenos.update((duenos) => [...duenos, usuario]);
        this.cancelarDueno();
      }
    });
  }

  protected quitarDueno(usuario: Usuario): void {
    this.duenos.update((duenos) => duenos.filter((d) => d.id !== usuario.id));
  }

  protected enviar(): void {
    this.formulario().markAllAsTouched();
    this.guardar.emit();
  }
}
