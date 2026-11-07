import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, switchMap } from 'rxjs';

import {
  CHIPS_SUGERIDOS_KIANA,
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  RespuestaKiana,
  SALUDO_KIANA,
} from '../../../core/models/kiana-chat.model';
import { KianaChatService } from '../../../core/services/kiana-chat.service';
import { CLAVE_TEMA, TemaService } from '../../../core/services/tema.service';
import { KianaWidgetComponent } from './kiana-widget.component';

function respuestaTras(
  ms: number,
  texto: string,
): Observable<RespuestaKiana> {
  return timer(ms).pipe(map(() => ({ texto })));
}

describe('KianaWidgetComponent', () => {
  let fixture: ComponentFixture<KianaWidgetComponent>;
  let pagina: HTMLElement;
  let chat: jasmine.SpyObj<KianaChatService>;

  beforeEach(async () => {
    localStorage.removeItem(CLAVE_TEMA);
    chat = jasmine.createSpyObj('KianaChatService', ['enviarMensaje']);
    chat.enviarMensaje.and.returnValue(of({ texto: 'Respuesta de prueba' }));

    await TestBed.configureTestingModule({
      imports: [KianaWidgetComponent],
      providers: [TemaService, { provide: KianaChatService, useValue: chat }],
    }).compileComponents();

    fixture = TestBed.createComponent(KianaWidgetComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

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
    expect(pagina.querySelector('.kiana-panel')).toBeNull();
    expect(pagina.querySelector('.kiana-fab__avatar img')?.getAttribute('src')).toContain(
      'idle.png',
    );
  });

  it('abre el panel con saludo, chips, disclaimer y maxlength 500', () => {
    abrirChat();

    expect(pagina.querySelector('.kiana-panel')).toBeTruthy();
    expect(pagina.textContent).toContain(SALUDO_KIANA);
    expect(pagina.textContent).toContain('En línea');
    expect(pagina.textContent).toContain('Verificá la información importante');
    for (const chip of CHIPS_SUGERIDOS_KIANA) {
      expect(pagina.textContent).toContain(chip);
    }

    const input = pagina.querySelector<HTMLInputElement>('.kiana-panel__input')!;
    expect(input.getAttribute('maxlength')).toBe(String(MAX_LONGITUD_MENSAJE_KIANA));
  });

  it('aplica data-theme desde TemaService', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    TestBed.inject(TemaService).establecerTema('claro');
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });

  it('envía un mensaje, muestra ... (Pensando) y luego la respuesta', fakeAsync(() => {
    chat.enviarMensaje.and.returnValue(respuestaTras(200, 'Los códigos empiezan con CR-'));
    abrirChat();
    escribirYEnviar('¿Qué es un código?');

    expect(pagina.textContent).toContain('¿Qué es un código?');
    expect(pagina.textContent).toContain('... (Pensando)');
    expect(chat.enviarMensaje).toHaveBeenCalledWith('¿Qué es un código?');
    expect(pagina.querySelector('.kiana-msg--pensando img')?.getAttribute('src')).toContain(
      'pensando.png',
    );

    tick(200);
    fixture.detectChanges();

    expect(pagina.textContent).not.toContain('... (Pensando)');
    expect(pagina.textContent).toContain('Los códigos empiezan con CR-');
    const avatares = pagina.querySelectorAll('.kiana-msg--kiana:not(.kiana-msg--error) img');
    expect(avatares[avatares.length - 1]?.getAttribute('src')).toContain('respondio.png');
  }));

  it('muestra burbuja de error cuando el servicio falla', fakeAsync(() => {
    chat.enviarMensaje.and.returnValue(
      timer(50).pipe(switchMap(() => throwError(() => ({ mensaje: MENSAJE_ERROR_KIANA })))),
    );
    abrirChat();
    escribirYEnviar('Hola');

    expect(pagina.textContent).toContain('... (Pensando)');
    tick(50);
    fixture.detectChanges();

    expect(pagina.textContent).toContain(MENSAJE_ERROR_KIANA);
    expect(pagina.querySelector('.kiana-msg--error')).toBeTruthy();
  }));

  it('los chips envían su texto como mensaje', fakeAsync(() => {
    chat.enviarMensaje.and.returnValue(respuestaTras(10, 'Ok'));
    abrirChat();

    const chip = CHIPS_SUGERIDOS_KIANA[0];
    const boton = Array.from(pagina.querySelectorAll<HTMLButtonElement>('.kiana-chip')).find(
      (el) => el.textContent?.trim() === chip,
    )!;
    boton.click();
    fixture.detectChanges();

    expect(chat.enviarMensaje).toHaveBeenCalledWith(chip);
    expect(pagina.textContent).toContain(chip);
    tick(10);
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Ok');
  }));

  it(`recorta la entrada a ${MAX_LONGITUD_MENSAJE_KIANA} caracteres`, () => {
    abrirChat();
    const input = pagina.querySelector<HTMLInputElement>('.kiana-panel__input')!;
    input.value = 'x'.repeat(MAX_LONGITUD_MENSAJE_KIANA + 40);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance['mensaje']().length).toBe(MAX_LONGITUD_MENSAJE_KIANA);
  });
});
