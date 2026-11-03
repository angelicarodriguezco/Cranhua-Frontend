import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { DetalleCosechaComponent } from './detalle-cosecha.component';

describe('DetalleCosechaComponent', () => {
  let fixture: ComponentFixture<DetalleCosechaComponent>;
  let elemento: HTMLElement;

  function crear(id: string): void {
    TestBed.configureTestingModule({
      imports: [DetalleCosechaComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    });
    fixture = TestBed.createComponent(DetalleCosechaComponent);
    elemento = fixture.nativeElement;
    fixture.detectChanges();
  }

  function escribirCantidad(valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>('#cantidad')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  it('muestra los datos de la cosecha y del productor', () => {
    crear('cosecha-caturra-catalina');
    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Finca La Catalina · Caturra');
    expect(texto).toContain('Rodrigo Solís');
    expect(texto).toContain('1650 msnm');
    expect(texto).toContain('320 kg');
    expect(texto).toContain('Jazmín');
  });

  it('calcula el total estimado con la cantidad y el precio por kg', () => {
    crear('cosecha-caturra-catalina');
    escribirCantidad('10');
    expect(elemento.querySelector('.total dd')?.textContent?.replace(/\D/g, '')).toBe('58000');
  });

  it('no deja pedir más de lo disponible', () => {
    crear('cosecha-caturra-catalina');
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('500');

    expect(elemento.querySelector('.error')?.textContent).toContain('Solo hay 320 kg');
    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('al enviar una cantidad válida navega a Mis solicitudes', () => {
    crear('cosecha-caturra-catalina');
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('20');

    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    expect(navegar).toHaveBeenCalledWith(['/tostador/solicitudes']);
  });

  it('el enlace Volver lleva a Explorar cosechas', () => {
    crear('cosecha-caturra-catalina');
    expect(elemento.querySelector('.volver')?.getAttribute('href')).toBe('/tostador/cosechas');
  });

  it('avisa si la cosecha no existe', () => {
    crear('no-existe');
    expect(elemento.textContent).toContain('No encontramos esta cosecha.');
  });
});
