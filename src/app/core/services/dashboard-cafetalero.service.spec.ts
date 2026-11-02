import { TestBed } from '@angular/core/testing';

import { COSECHAS_DASHBOARD, SOLICITUDES_DASHBOARD } from '../mocks/dashboard-cafetalero.mock';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';

describe('DashboardCafetaleroService', () => {
  let servicio: DashboardCafetaleroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(DashboardCafetaleroService);
  });

  it('expone los indicadores del prototipo unificado', () => {
    const indicadores = servicio.indicadores();
    expect(indicadores.fincasRegistradas).toBe(2);
    expect(indicadores.cosechasActivas).toBe(3);
    expect(indicadores.kgDisponibles).toBe(146);
    expect(indicadores.solicitudesPendientes).toBe(2);
  });

  it('lista las solicitudes pendientes con Monte Alto', () => {
    const pendientes = servicio.solicitudesPendientes();
    expect(pendientes).toHaveSize(2);
    expect(pendientes[0].nombreTostador).toBe('Tostaduría Volcán');
    expect(pendientes[1].finca).toBe('Monte Alto');
  });

  it('aprueba una solicitud y descuenta kg de la cosecha', () => {
    const solicitud = SOLICITUDES_DASHBOARD[0];
    const kgInicial = COSECHAS_DASHBOARD.find((c) => c.id === solicitud.cosechaId)!.kgDisponibles!;

    servicio.aprobarSolicitud(solicitud.id);

    expect(servicio.solicitudesPendientes()).toHaveSize(1);
    expect(servicio.indicadores().solicitudesPendientes).toBe(1);
    expect(servicio.indicadores().kgDisponibles).toBe(146 - solicitud.kgSolicitados);

    const cosecha = servicio.cosechasRecientes().find((c) => c.id === solicitud.cosechaId);
    expect(cosecha?.kgDisponibles).toBe(kgInicial - solicitud.kgSolicitados);
  });

  it('rechaza una solicitud sin cambiar kg disponibles', () => {
    servicio.rechazarSolicitud(SOLICITUDES_DASHBOARD[1].id);

    expect(servicio.solicitudesPendientes()).toHaveSize(1);
    expect(servicio.indicadores().kgDisponibles).toBe(146);
    expect(servicio.indicadores().solicitudesPendientes).toBe(1);
  });

  it('ignora aprobar o rechazar una solicitud inexistente o ya resuelta', () => {
    servicio.aprobarSolicitud('no-existe');
    expect(servicio.solicitudesPendientes()).toHaveSize(2);

    servicio.aprobarSolicitud(SOLICITUDES_DASHBOARD[0].id);
    servicio.aprobarSolicitud(SOLICITUDES_DASHBOARD[0].id);
    expect(servicio.solicitudesPendientes()).toHaveSize(1);
  });

  it('alterna el tema entre oscuro y claro', () => {
    expect(servicio.tema()).toBe('oscuro');
    servicio.alternarTema();
    expect(servicio.tema()).toBe('claro');
    servicio.establecerTema('oscuro');
    expect(servicio.tema()).toBe('oscuro');
  });

  it('sincroniza y elimina cosechas recientes en memoria', () => {
    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Natural',
      kgDisponibles: 30,
      estado: 'Disponible',
    });
    expect(servicio.cosechasRecientes()[0].id).toBe('cosecha-nueva-test');
    expect(servicio.indicadores().cosechasActivas).toBe(4);

    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Honey',
      kgDisponibles: 28,
      estado: 'Disponible',
    });
    expect(servicio.cosechasRecientes().find((c) => c.id === 'cosecha-nueva-test')?.proceso).toBe(
      'Honey',
    );

    servicio.eliminarCosechaReciente('cosecha-nueva-test');
    expect(servicio.cosechasRecientes().some((c) => c.id === 'cosecha-nueva-test')).toBeFalse();
    expect(servicio.indicadores().cosechasActivas).toBe(3);
  });
});
