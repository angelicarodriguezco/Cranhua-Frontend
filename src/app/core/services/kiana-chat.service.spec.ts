import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import {
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  SALUDO_KIANA,
} from '../models/kiana-chat.model';
import { KianaChatService } from './kiana-chat.service';

const URL_CHAT = `${environment.apiUrl}/api/ai/chat`;

describe('KianaChatService', () => {
  let servicio: KianaChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(KianaChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const textos = () => servicio.mensajes().map((m) => `${m.rol}:${m.texto}`);

  it('iniciar agrega el saludo una sola vez', () => {
    servicio.iniciar();
    servicio.iniciar();

    expect(textos()).toEqual([`kiana:${SALUDO_KIANA}`]);
  });

  it('envía el mensaje al endpoint real y agrega la respuesta de Kiana', () => {
    servicio.enviar('  Hola  ');

    expect(servicio.pensando()).toBeTrue();
    const req = http.expectOne(URL_CHAT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Hola', conversationId: null });

    req.flush({ reply: 'Hola, ¿en qué te ayudo?', conversationId: 'conv-1' });

    expect(servicio.pensando()).toBeFalse();
    expect(textos()).toEqual([
      `kiana:${SALUDO_KIANA}`,
      'usuario:Hola',
      'kiana:Hola, ¿en qué te ayudo?',
    ]);
  });

  it('reutiliza el conversationId que devuelve el backend', () => {
    servicio.enviar('Primero');
    http.expectOne(URL_CHAT).flush({ reply: 'Uno', conversationId: 'conv-1' });

    servicio.enviar('Segundo');
    const req = http.expectOne(URL_CHAT);
    expect(req.request.body).toEqual({ message: 'Segundo', conversationId: 'conv-1' });
    req.flush({ reply: 'Dos', conversationId: 'conv-1' });
  });

  it('ignora mensajes vacíos y envíos mientras espera respuesta', () => {
    servicio.enviar('   ');
    http.expectNone(URL_CHAT);

    servicio.enviar('Uno');
    servicio.enviar('Dos');
    const req = http.expectOne(URL_CHAT);
    expect(req.request.body.message).toBe('Uno');
    req.flush({ reply: 'Ok', conversationId: 'c' });
  });

  it(`recorta el mensaje a ${MAX_LONGITUD_MENSAJE_KIANA} caracteres`, () => {
    servicio.enviar('x'.repeat(MAX_LONGITUD_MENSAJE_KIANA + 50));

    const req = http.expectOne(URL_CHAT);
    expect(req.request.body.message.length).toBe(MAX_LONGITUD_MENSAJE_KIANA);
    req.flush({ reply: 'Ok', conversationId: 'c' });
  });

  it('muestra como mensaje de Kiana el error de demasiados mensajes (429)', () => {
    const mensaje = 'Enviaste muchos mensajes seguidos. Esperá un minuto e intentá de nuevo.';
    servicio.enviar('Hola');
    http.expectOne(URL_CHAT).flush({ mensaje }, { status: 429, statusText: 'Too Many Requests' });

    expect(servicio.pensando()).toBeFalse();
    const ultimo = servicio.mensajes().at(-1)!;
    expect(ultimo.rol).toBe('error');
    expect(ultimo.texto).toBe(mensaje);
  });

  it('muestra como mensaje de Kiana el error de servicio no disponible (503)', () => {
    const mensaje = 'Kiana no está disponible en este momento. Intentá de nuevo en un rato.';
    servicio.enviar('Hola');
    http.expectOne(URL_CHAT).flush({ mensaje }, { status: 503, statusText: 'Service Unavailable' });

    expect(servicio.mensajes().at(-1)).toEqual(
      jasmine.objectContaining({ rol: 'error', texto: mensaje }),
    );
  });

  it('usa el error del campo cuando el backend rechaza el mensaje (400)', () => {
    servicio.enviar('Hola');
    http.expectOne(URL_CHAT).flush(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { message: 'El mensaje no puede pasar de 500 caracteres.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(servicio.mensajes().at(-1)?.texto).toBe('El mensaje no puede pasar de 500 caracteres.');
  });

  it('usa el mensaje genérico si no hay conexión con el backend', () => {
    servicio.enviar('Hola');
    http.expectOne(URL_CHAT).error(new ProgressEvent('error'), { status: 0 });

    expect(servicio.mensajes().at(-1)).toEqual(
      jasmine.objectContaining({ rol: 'error', texto: MENSAJE_ERROR_KIANA }),
    );
  });
});
