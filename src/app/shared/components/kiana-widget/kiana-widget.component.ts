import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';

import {
  CHIPS_SUGERIDOS_KIANA,
  MAX_LONGITUD_MENSAJE_KIANA,
  MensajeKiana,
} from '../../../core/models/kiana-chat.model';
import { KianaChatService } from '../../../core/services/kiana-chat.service';

const AVATAR_IDLE = '/images/kiana/idle.png';
const AVATAR_PENSANDO = '/images/kiana/pensando.png';
const AVATAR_RESPONDIO = '/images/kiana/respondio.png';

const TEXTO_PENSANDO = 'Pensando…';
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
  private timerPrompter: ReturnType<typeof setTimeout> | null = null;

  protected readonly abierto = signal(false);
  protected readonly prompterVisible = signal(true);
  protected readonly mensaje = signal('');
  protected readonly mensajes = this.chat.mensajes;
  protected readonly pensando = this.chat.pensando;

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

    effect(() => {
      this.mensajes();
      this.pensando();
      this.scrollAlFinal();
    });

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
    this.chat.iniciar();
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
    this.chat.enviar(texto);
  }

  protected onEnviar(): void {
    if (!this.puedeEnviar()) {
      return;
    }
    this.chat.enviar(this.mensaje());
    this.mensaje.set('');
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
