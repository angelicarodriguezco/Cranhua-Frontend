import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.component.html',
  styleUrl: './modal-confirmacion.component.css',
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class ModalConfirmacionComponent implements OnDestroy {
  private readonly injector = inject(Injector);

  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly etiquetaCancelar = input('Cancelar');
  readonly etiquetaConfirmar = input('Confirmar');

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  private readonly dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');
  private readonly botonCancelar = viewChild<ElementRef<HTMLButtonElement>>('botonCancelar');

  private elementoPrevio: HTMLElement | null = null;
  private readonly onFocusIn = (event: FocusEvent): void => {
    const dialogo = this.dialogo()?.nativeElement;
    if (!dialogo) {
      return;
    }
    const destino = event.target;
    if (destino instanceof Node && !dialogo.contains(destino)) {
      event.stopPropagation();
      this.enfocarPrimerElemento();
    }
  };

  constructor() {
    afterNextRender(
      () => {
        this.elementoPrevio =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.addEventListener('focusin', this.onFocusIn);
        this.botonCancelar()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    document.removeEventListener('focusin', this.onFocusIn);
    this.elementoPrevio?.focus();
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancelar();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focables = this.elementosFocables();
    if (focables.length === 0) {
      return;
    }

    const primero = focables[0];
    const ultimo = focables[focables.length - 1];
    const activo = document.activeElement;

    if (event.shiftKey && activo === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && activo === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  protected onCancelar(): void {
    this.cancelar.emit();
  }

  protected onConfirmar(): void {
    this.confirmar.emit();
  }

  private enfocarPrimerElemento(): void {
    const focables = this.elementosFocables();
    (focables[0] ?? this.dialogo()?.nativeElement)?.focus();
  }

  private elementosFocables(): HTMLElement[] {
    const dialogo = this.dialogo()?.nativeElement;
    if (!dialogo) {
      return [];
    }

    return Array.from(
      dialogo.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }
}
