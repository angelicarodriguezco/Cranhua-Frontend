import { TestBed } from '@angular/core/testing';

import { TuesteService, calcularMerma } from './tueste.service';

describe('calcularMerma', () => {
  it('devuelve el porcentaje de peso perdido', () => {
    expect(calcularMerma(12, 10.2)).toBeCloseTo(15, 5);
    expect(calcularMerma(10, 10)).toBe(0);
  });

  it('devuelve null si los pesos no alcanzan para calcularla', () => {
    expect(calcularMerma(null, 5)).toBeNull();
    expect(calcularMerma(0, 0)).toBeNull();
    expect(calcularMerma(10, null)).toBeNull();
    expect(calcularMerma(5, 6)).toBeNull();
  });
});

describe('TuesteService', () => {
  let servicio: TuesteService;

  beforeEach(() => {
    servicio = TestBed.inject(TuesteService);
  });

  it('numera los códigos de trazabilidad por lote', () => {
    const datos = {
      nivel: 'Medio',
      pesoVerdeKg: 5,
      pesoTostadoKg: 4.2,
      fecha: '2026-11-01',
    } as const;
    let codigos: string[] = [];
    servicio
      .registrar({ ...datos, loteId: 'l-los-robles-catuai', notas: null })
      .subscribe((t) => (codigos = [...codigos, t.codigoTrazabilidad]));
    servicio
      .registrar({ ...datos, loteId: 'l-los-robles-catuai', notas: null })
      .subscribe((t) => (codigos = [...codigos, t.codigoTrazabilidad]));

    expect(codigos).toEqual(['CRH-2026-0103-T01', 'CRH-2026-0103-T02']);
  });

  it('genera el código de trazabilidad de un lote pendiente', () => {
    servicio
      .generarCodigo('l-los-robles-catuai')
      .subscribe((lote) => expect(lote.codigoTrazabilidad).toBe('TRZ-0103-MC'));

    servicio.lotesComprados().subscribe((lotes) => {
      expect(lotes.find((l) => l.id === 'l-los-robles-catuai')!.codigoTrazabilidad).toBe(
        'TRZ-0103-MC',
      );
    });
  });

  it('no cambia el código de un lote que ya lo tiene', () => {
    servicio
      .generarCodigo('l-catalina-caturra')
      .subscribe((lote) => expect(lote.codigoTrazabilidad).toBe('TRZ-0101-MC'));
  });

  it('devuelve solo los tuestes del lote', () => {
    servicio.tuestesDelLote('l-catalina-caturra').subscribe((tuestes) => {
      expect(tuestes.map((t) => t.id)).toEqual(['tu-catalina-1', 'tu-catalina-2']);
    });
    servicio
      .tuestesDelLote('l-los-robles-catuai')
      .subscribe((tuestes) => expect(tuestes).toEqual([]));
  });

  it('al actualizar conserva el lote y el código', () => {
    servicio
      .actualizar('tu-monte-alto-1', {
        nivel: 'Medio',
        pesoVerdeKg: 6,
        pesoTostadoKg: 5.1,
        fecha: '2026-10-29',
        notas: 'Segunda pasada',
      })
      .subscribe();

    servicio.obtener('tu-monte-alto-1').subscribe((t) => {
      expect(t!.loteId).toBe('l-monte-alto-geisha');
      expect(t!.codigoTrazabilidad).toBe('CRH-2026-0102-T01');
      expect(t!.pesoVerdeKg).toBe(6);
    });
  });
});