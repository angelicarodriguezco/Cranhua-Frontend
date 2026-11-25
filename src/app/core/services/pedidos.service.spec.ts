import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ErrorPedido, HistorialPedidos, Pedido } from '../models/pedido.model';
import { historialApi, pedidoApi } from '../testing/pedidos-cafeteria.fixture';
import { PedidosService } from './pedidos.service';

const BASE = `${environment.apiUrl}/api/pedidos`;

describe('PedidosService', () => {
  let servicio: PedidosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PedidosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista el historial con los indicadores del backend, en el orden en que llega', () => {
    let historial: HistorialPedidos | undefined;
    servicio.listar().subscribe((h) => (historial = h));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(historialApi());

    expect(historial?.indicadores).toEqual({
      activos: 1,
      kgRecibidosMes: 15,
      tostadoresActivos: 2,
    });
    expect(historial?.pedidos.map((p) => p.id)).toEqual(['p-1', 'p-cancelado', 'p-viejo']);
    expect(historial?.pedidos[0]).toEqual({
      id: 'p-1',
      tostador: 'Tostaduría Volcán',
      kilos: 12,
      fecha: '2026-11-20',
      estado: 'En camino',
    });
  });

  it('crea el pedido con el tueste y la cantidad en kg', () => {
    let creado: Pedido | undefined;
    servicio.crear({ tuesteId: 'tu-1', kilos: 12 }).subscribe((p) => (creado = p));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ tuesteId: 'tu-1', cantidadKg: 12 });
    req.flush(pedidoApi());

    expect(creado?.estado).toBe('En camino');
  });

  it('pedir más de lo disponible trae el mensaje del backend', () => {
    let error: ErrorPedido | undefined;
    servicio.crear({ tuesteId: 'tu-1', kilos: 999 }).subscribe({ error: (e) => (error = e) });

    http
      .expectOne(BASE)
      .flush(
        { mensaje: 'No hay suficiente café disponible: pedís 999 kg y quedan 60 kg.' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error).toEqual({
      mensaje: 'No hay suficiente café disponible: pedís 999 kg y quedan 60 kg.',
      errores: {},
    });
  });

  it('un 400 de validación trae los errores por campo', () => {
    let error: ErrorPedido | undefined;
    servicio.crear({ tuesteId: 'tu-1', kilos: 0 }).subscribe({ error: (e) => (error = e) });

    http.expectOne(BASE).flush(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { cantidadKg: 'La cantidad tiene que ser mayor a 0.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error?.errores).toEqual({ cantidadKg: 'La cantidad tiene que ser mayor a 0.' });
  });

  it('un tueste que ya no existe trae el mensaje del backend', () => {
    let error: ErrorPedido | undefined;
    servicio.crear({ tuesteId: 'tu-x', kilos: 1 }).subscribe({ error: (e) => (error = e) });

    http
      .expectOne(BASE)
      .flush({ mensaje: 'No encontramos ese tueste.' }, { status: 404, statusText: 'Not Found' });

    expect(error?.mensaje).toBe('No encontramos ese tueste.');
  });

  it('un error de red al crear da un mensaje genérico', () => {
    let error: ErrorPedido | undefined;
    servicio.crear({ tuesteId: 'tu-1', kilos: 1 }).subscribe({ error: (e) => (error = e) });

    http.expectOne(BASE).flush(null, { status: 0, statusText: 'Unknown Error' });

    expect(error?.mensaje).toContain('No pudimos enviar el pedido');
  });

  it('marcar recibido y cancelar mandan el estado nuevo por PATCH', () => {
    servicio.marcarRecibido('p-1').subscribe();
    const recibido = http.expectOne(`${BASE}/p-1`);
    expect(recibido.request.method).toBe('PATCH');
    expect(recibido.request.body).toEqual({ estado: 'ENTREGADO' });
    recibido.flush(pedidoApi({ estado: 'ENTREGADO' }));

    servicio.cancelar('p-2').subscribe();
    const cancelado = http.expectOne(`${BASE}/p-2`);
    expect(cancelado.request.body).toEqual({ estado: 'CANCELADO' });
    cancelado.flush(pedidoApi({ id: 'p-2', estado: 'CANCELADO' }));
  });

  it('cambiar un pedido ya cerrado trae el mensaje del backend', () => {
    let error: ErrorPedido | undefined;
    servicio.cancelar('p-1').subscribe({ error: (e) => (error = e) });

    http
      .expectOne(`${BASE}/p-1`)
      .flush({ mensaje: 'El pedido ya fue cerrado.' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.mensaje).toBe('El pedido ya fue cerrado.');
  });
});
