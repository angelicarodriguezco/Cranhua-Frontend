import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CHIPS_SUGERIDOS_KIANA,
  ErrorKiana,
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  MensajeKiana,
  SALUDO_KIANA,
} from '../../../core/models/kiana-chat.model';
import { KianaChatService } from '../../../core/services/kiana-chat.service';

const AVATAR_IDLE = '/images/kiana/idle.png';
const AVATAR_PENSANDO = '/images/kiana/pensando.png';
const AVATAR_RESPONDIO = '/images/kiana/respondio.png';

const TEXTO_PENSANDO = '... (Pensando)';
const TEXTO_PROMPTER = '¿Necesitás ayuda? Preguntame lo que sea !';
const PLACEHOLDER_INPUT = 'Escribí tu mensaje...';
const DISCLAIMER_KIANA = 'Kiana puede cometer errores. Verificá la información importante.';
const MS_AUTO_OCULTAR_PROMPTER = 6000;

@Component({
  selector: 'app-kiana-widget',
  templateUrl: './kiana-widget.component.html',
  styleUrl: './kiana-widget.component.css',
  host: { '[attr.data-theme]': "'claro'" },
})
export class KianaWidgetComponent {
  private readonly chat = inject(KianaChatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly hilo = viewChild<ElementRef<HTMLElement>>('hilo');
  private contadorIds = 0;
  private saludoAgregado = false;
  private timerPrompter: ReturnType<typeof setTimeout> | null = null;

  protected readonly abierto = signal(false);
  protected readonly prompterVisible = signal(true);
  protected readonly mensaje = signal('');
  protected readonly mensajes = signal<MensajeKiana[]>([]);
  protected readonly pensando = signal(false);

  protected readonly chips = CHIPS_SUGERIDOS_KIANA;
  protected readonly maxLongitud = MAX_LONGITUD_MENSAJE_KIANA;
  protected readonly avatarIdle = AVATAR_IDLE;
  protected readonly avatarPensando = AVATAR_PENSANDO;
  protected readonly textoPrompter = TEXTO_PROMPTER;
  protected readonly textoPensando = TEXTO_PENSANDO;
  protected readonly placeholderInput = PLACEHOLDER_INPUT;
  protected readonly disclaimer = DISCLAIMER_KIANA;

  protected readonly puedeEnviar = computed(
    () => !this.pensando() && this.mensaje().trim().length > 0,
  );

  constructor() {
    afterNextRender(
      () => {
        this.timerPrompter = setTimeout(() => {
          this.zone.run(() => {
            this.prompterVisible.set(false);
            this.timerPrompter = null;
            this.cdr.detectChanges();
          });
        }, MS_AUTO_OCULTAR_PROMPTER);
      },
      { injector: this.injector },
    );

    this.destroyRef.onDestroy(() => this.limpiarTimerPrompter());
  }

  protected avatarMensaje(mensaje: MensajeKiana): string {
    if (mensaje.rol === 'error') {
      return AVATAR_PENSANDO;
    }
    if (mensaje.rol === 'kiana') {
      const esSaludo = this.mensajes()[0]?.id === mensaje.id;
      return esSaludo ? AVATAR_IDLE : AVATAR_RESPONDIO;
    }
    return AVATAR_IDLE;
  }

  protected abrir(): void {
    this.ocultarPrompter();
    this.abierto.set(true);
    this.asegurarSaludo();
    this.cdr.detectChanges();
    this.scrollAlFinal();
  }

  protected cerrar(): void {
    this.abierto.set(false);
    this.cdr.detectChanges();
  }

  protected ocultarPrompter(event?: Event): void {
    event?.stopPropagation();
    this.prompterVisible.set(false);
    this.limpiarTimerPrompter();
    this.cdr.detectChanges();
  }

  protected onMensajeInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.slice(0, this.maxLongitud);
    this.mensaje.set(valor);
  }

  protected onChip(texto: string): void {
    this.enviarTexto(texto);
  }

  protected onEnviar(): void {
    this.enviarTexto(this.mensaje());
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.onEnviar();
  }

  private limpiarTimerPrompter(): void {
    if (this.timerPrompter !== null) {
      clearTimeout(this.timerPrompter);
      this.timerPrompter = null;
    }
  }

  private asegurarSaludo(): void {
    if (this.saludoAgregado) {
      return;
    }
    this.saludoAgregado = true;
    this.mensajes.set([this.crearMensaje('kiana', SALUDO_KIANA)]);
  }

  private enviarTexto(texto: string): void {
    if (this.pensando()) {
      return;
    }

    const normalizado = texto.trim().slice(0, this.maxLongitud);
    if (!normalizado) {
      return;
    }

    this.asegurarSaludo();
    this.mensaje.set('');
    this.mensajes.update((actuales) => [...actuales, this.crearMensaje('usuario', normalizado)]);
    this.pensando.set(true);
    this.cdr.detectChanges();
    this.scrollAlFinal();

    this.chat
      .enviarMensaje(normalizado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.zone.run(() => {
            this.pensando.set(false);
            this.mensajes.update((actuales) => [
              ...actuales,
              this.crearMensaje('kiana', respuesta.texto),
            ]);
            this.cdr.detectChanges();
            this.scrollAlFinal();
          });
        },
        error: (error: ErrorKiana) => {
          this.zone.run(() => {
            this.pensando.set(false);
            this.mensajes.update((actuales) => [
              ...actuales,
              this.crearMensaje('error', error?.mensaje ?? MENSAJE_ERROR_KIANA),
            ]);
            this.cdr.detectChanges();
            this.scrollAlFinal();
          });
        },
      });
  }

  private crearMensaje(rol: MensajeKiana['rol'], texto: string): MensajeKiana {
    this.contadorIds += 1;
    return {
      id: `kiana-msg-${this.contadorIds}`,
      rol,
      texto,
      creadoEn: Date.now(),
    };
  }

  private scrollAlFinal(): void {
    afterNextRender(
      () => {
        const el = this.hilo()?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      },
      { injector: this.injector },
    );
  }
}
