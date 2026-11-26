import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { cosechaDePrueba } from '../../../../core/testing/cosechas-de-prueba';
import { ResumenCosechaComponent } from './resumen-cosecha.component';

const COSECHA = cosechaDePrueba({
  id: 'cosecha-1',
  variedad: 'Caturra',
  cantidadCosechadaKg: 120,
  procesos: [
    { proceso: 'Honey', porcentaje: 60 },
    { proceso: 'Lavado', porcentaje: 40 },
  ],
  pesoTrasBeneficiadoKg: 120,
  pesoTrasSeleccionKg: 96,
  caracolilloKg: 4,
  mermaSeleccionPorcentaje: 20,
  puntajeSca: 84.5,
  precioKg: 4500,
});

describe('ResumenCosechaComponent', () => {
  let fixture: ComponentFixture<ResumenCosechaComponent>;
  let pagina: HTMLElement;
  let componente: ResumenCosechaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenCosechaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenCosechaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.componentRef.setInput('cosecha', COSECHA);
    fixture.detectChanges();
  });

  it('muestra el resumen de la cosecha guardada', () => {
    expect(pagina.textContent).toContain('¡Cosecha registrada!');
    expect(pagina.textContent).toContain('Finca La Catalina');
    expect(pagina.textContent).toContain('Caturra');
    expect(pagina.textContent).toContain('msnm');
    expect(pagina.textContent).toContain('Honey 60% (72 kg)');
    expect(pagina.textContent).toContain('Lavado 40% (48 kg)');
    expect(pagina.textContent).toContain('merma 20%');
    expect(pagina.textContent?.replace(/\s/g, ' ')).toContain('₡4 500');
    expect(pagina.textContent).toContain('Sí, 4 kg');
    expect(pagina.textContent).toContain('84.5 pts');
    expect(pagina.textContent).toContain('Registrar otra cosecha');
  });

  it('emite registrar otra y ver cosecha', () => {
    const registrarOtra: string[] = [];
    const verIds: string[] = [];
    componente.registrarOtra.subscribe(() => registrarOtra.push('ok'));
    componente.verCosecha.subscribe((id) => verIds.push(id));

    const botones = pagina.querySelectorAll<HTMLButtonElement>('button');
    [...botones].find((b) => b.textContent?.includes('Registrar otra cosecha'))!.click();
    [...botones].find((b) => b.textContent?.includes('Ver cosecha'))!.click();

    expect(registrarOtra).toEqual(['ok']);
    expect(verIds).toEqual(['cosecha-1']);
  });

  function publicarAhora(): HTMLButtonElement | undefined {
    return [...pagina.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('Publicar ahora'),
    );
  }

  it('en borrador con kg disponibles muestra Publicar ahora y lo emite', () => {
    const publicadas: string[] = [];
    componente.publicar.subscribe((id) => publicadas.push(id));

    expect(pagina.textContent).toContain('Borrador');
    expect(pagina.textContent).toContain('Quedó como borrador');
    publicarAhora()!.click();
    expect(publicadas).toEqual(['cosecha-1']);
  });

  it('sin kg disponibles deshabilita Publicar ahora', () => {
    fixture.componentRef.setInput('cosecha', { ...COSECHA, kgDisponibles: null });
    fixture.detectChanges();

    expect(publicarAhora()!.disabled).toBeTrue();
    expect(pagina.querySelector('.falta-peso')).not.toBeNull();
  });

  it('mientras publica deshabilita el botón', () => {
    fixture.componentRef.setInput('publicando', true);
    fixture.detectChanges();
    expect(publicarAhora()!.disabled).toBeTrue();
  });

  it('ya publicada muestra Publicada y no ofrece publicar', () => {
    fixture.componentRef.setInput('cosecha', { ...COSECHA, estado: 'Publicada' });
    fixture.detectChanges();

    expect(pagina.textContent).toContain('Publicada');
    expect(pagina.textContent).toContain('Ya está publicada');
    expect(publicarAhora()).toBeUndefined();
  });
});
