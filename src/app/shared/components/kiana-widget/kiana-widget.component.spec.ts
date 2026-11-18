import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import {
  CHIPS_SUGERIDOS_KIANA,
  MAX_LONGITUD_MENSAJE_KIANA,
  SALUDO_KIANA,
} from '../../../core/models/kiana-chat.model';
import { KianaWidgetComponent } from './kiana-widget.component';

const URL_CHAT = `${environment.apiUrl}/api/ai/chat`;

describe('KianaWidgetComponent', () => {
  let fixture: ComponentFixture<KianaWidgetComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KianaWidgetComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(KianaWidgetComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function abrirChat(): void {
    pagina.querySelector<HTMLButtonElement>('.kiana-fab__avatar')!.click();
    fixture.detectChanges();
  }

  function escribirYEnviar(texto: string): void {
    const input = pagina.querySelector<HTMLInputElement>('.kiana-panel__input')!;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('.kiana-panel__enviar')!.click();
    fixture.detectChanges();
  }

  it('muestra el FAB colapsado con el prompter', () => {
    expect(pagina.textContent).toContain('¿Necesitás ayuda? Preguntame lo que sea !');
    expect(pagina.querySelector('.kiana-fab')?.hasAttribute('hidden')).toBeFalse();
    expect(pagina.querySelector('.kiana-panel')?.hasAttribute('hidden')).toBeTrue();
    expect(pagina.querySelector('.kiana-fab__avatar img')?.getAttribute('src')).toContain(
      'idle.png',
    );
  });

  it('oculta el prompter al cerrarlo o tras unos segundos', fakeAsync(() => {
    expect(pagina.querySelector('.kiana-fab__burbuja')).toBeTruthy();

    pagina.querySelector<HTMLButtonElement>('.kiana-fab__cerrar-prompter')!.click();
    fixture.detectChanges();
    expect(pagina.querySelector('.kiana-fab__burbuja')).toBeNull();
    expect(pagina.querySelector('.kiana-fab__avatar')).toBeTruthy();

    fixture = TestBed.createComponent(KianaWidgetComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    expect(pagina.querySelector('.kiana-fab__burbuja')).toBeTruthy();

    tick(6000);
    fixture.detectChanges();
    expect(pagina.querySelector('.kiana-fab__burbuja')).toBeNull();
    expect(pagina.querySelector('.kiana-fab__avatar')).toBeTruthy();
  }));

  it('abre el panel con saludo, chips, disclaimer y maxlength 500', () => {
    abrirChat();

    expect(pagina.querySelector('.kiana-fab')?.hasAttribute('hidden')).toBeTrue();
    expect(pagina.querySelector('.kiana-panel')?.hasAttribute('hidden')).toBeFalse();
    expect(pagina.textContent).toContain(SALUDO_KIANA);
    expect(pagina.textContent).toContain('En línea');
    expect(pagina.textContent).toContain('Verificá la información importante');
    for (const chip of CHIPS_SUGERIDOS_KIANA) {
      expect(pagina.textContent).toContain(chip);
    }

    const input = pagina.querySelector<HTMLInputElement>('.kiana-panel__input')!;
    expect(input.getAttribute('maxlength')).toBe(String(MAX_LONGITUD_MENSAJE_KIANA));
  });

  it('usa tema claro fijo', () => {
    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });

  it('envía un mensaje, muestra Pensando… y luego la respuesta real', () => {
    abrirChat();
    escribirYEnviar('¿Qué es un código?');

    expect(pagina.textContent).toContain('¿Qué es un código?');
    expect(pagina.textContent).toContain('Pensando…');
    expect(pagina.querySelector('.kiana-msg--pensando img')?.getAttribute('src')).toContain(
      'pensando.png',
    );

    const req = http.expectOne(URL_CHAT);
    expect(req.request.body.message).toBe('¿Qué es un código?');
    req.flush({ reply: 'Los códigos empiezan con CR-', conversationId: 'c-1' });
    fixture.detectChanges();

    expect(pagina.textContent).not.toContain('Pensando…');
    expect(pagina.textContent).toContain('Los códigos empiezan con CR-');
    const avatares = pagina.querySelectorAll('.kiana-msg--kiana:not(.kiana-msg--error) img');
    expect(avatares[avatares.length - 1]?.getAttribute('src')).toContain('respondio.png');
  });

  it('muestra el error del servicio como mensaje de Kiana', () => {
    const mensaje = 'Enviaste muchos mensajes seguidos. Esperá un minuto e intentá de nuevo.';
    abrirChat();
    escribirYEnviar('Hola');

    http.expectOne(URL_CHAT).flush({ mensaje }, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    expect(pagina.querySelector('.kiana-msg--error')?.textContent).toContain(mensaje);
    expect(pagina.textContent).not.toContain('Pensando…');
  });

  it('los chips envían su texto como mensaje', () => {
    abrirChat();

    const chip = CHIPS_SUGERIDOS_KIANA[0];
    const boton = Array.from(pagina.querySelectorAll<HTMLButtonElement>('.kiana-chip')).find(
      (el) => el.textContent?.trim() === chip,
    )!;
    boton.click();
    fixture.detectChanges();

    const req = http.expectOne(URL_CHAT);
    expect(req.request.body.message).toBe(chip);
    expect(pagina.textContent).toContain(chip);
    req.flush({ reply: 'Ok', conversationId: 'c-1' });
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Ok');
  });

  it('conserva la conversación si el widget se destruye y se vuelve a crear', () => {
    abrirChat();
    escribirYEnviar('Hola');
    http.expectOne(URL_CHAT).flush({ reply: 'Hola, visitante', conversationId: 'c-1' });
    fixture.destroy();

    fixture = TestBed.createComponent(KianaWidgetComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    abrirChat();

    expect(pagina.textContent).toContain('Hola, visitante');
    expect(pagina.querySelectorAll('.kiana-msg').length).toBe(3);
  });

  it(`recorta la entrada a ${MAX_LONGITUD_MENSAJE_KIANA} caracteres`, () => {
    abrirChat();
    const input = pagina.querySelector<HTMLInputElement>('.kiana-panel__input')!;
    input.value = 'x'.repeat(MAX_LONGITUD_MENSAJE_KIANA + 40);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance['mensaje']().length).toBe(MAX_LONGITUD_MENSAJE_KIANA);
  });
});
