import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, NEVER } from 'rxjs';

import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilFincaPublicoComponent } from './perfil-finca-publico.component';

describe('PerfilFincaPublicoComponent', () => {
  let fixture: ComponentFixture<PerfilFincaPublicoComponent>;
  let pagina: HTMLElement;
  let paramMap$: BehaviorSubject<ParamMap>;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'finca-el-roble' }));
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [PerfilFincaPublicoComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
            paramMap: paramMap$.asObservable(),
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilFincaPublicoComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  it('renderiza nombre, ubicación y cafetería con href al perfil mock', () => {
    expect(pagina.textContent).toContain('Finca El Roble');
    expect(pagina.textContent).toContain('Naranjo, Costa Rica');

    const cafe = [...pagina.querySelectorAll<HTMLAnchorElement>('a.chip')].find((a) =>
      a.textContent?.includes('Café Brumas'),
    );
    expect(cafe).toBeTruthy();
    expect(cafe!.getAttribute('href')).toBe('/explorar/cafeteria/c-cafe-brumas');
  });

  it('resalta la cosecha activa solo con el query param cosecha', () => {
    expect(pagina.querySelector('.cosecha--resaltada')).toBeNull();
    expect(pagina.querySelector('.cosecha__codigo')).toBeNull();

    queryParamMap$.next(convertToParamMap({ cosecha: 'cosecha-catuai-el-roble' }));
    fixture.detectChanges();

    expect(pagina.querySelector('.cosecha--resaltada')).toBeTruthy();
    expect(pagina.querySelector('.cosecha__codigo')?.textContent).toContain('CRH-2026-0103');
  });

  it('enlaza volver al directorio y ver lotes con centrar/resaltar', () => {
    const volver = [...pagina.querySelectorAll<HTMLAnchorElement>('a')].find((a) =>
      a.textContent?.includes('Volver al directorio'),
    );
    expect(volver?.getAttribute('href')).toBe('/explorar');

    const lotes = [...pagina.querySelectorAll<HTMLAnchorElement>('a.cta')].find((a) =>
      a.textContent?.includes('Ver lotes trazables'),
    );
    expect(lotes?.getAttribute('href')).toBe(
      '/explorar?centrar=finca-el-roble&resaltar=finca-el-roble',
    );
  });

  it('el toggle cambia data-theme en el host', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    expect(pagina.querySelector<HTMLImageElement>('.marca__logo')?.getAttribute('src')).toBe(
      '/images/logo-cranhua.png',
    );

    boton('Claro').click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    expect(pagina.querySelector<HTMLImageElement>('.marca__logo')?.getAttribute('src')).toBe(
      '/images/logo-cranhua-negro.png',
    );

    boton('Oscuro').click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });

  it('muestra estado vacío si el id no existe', () => {
    paramMap$.next(convertToParamMap({ id: 'finca-inexistente' }));
    fixture.detectChanges();

    expect(pagina.textContent).toContain('No encontramos esta finca');
    const enlace = [...pagina.querySelectorAll<HTMLAnchorElement>('a')].find((a) =>
      a.textContent?.includes('Volver al directorio'),
    );
    expect(enlace?.getAttribute('href')).toBe('/explorar');
  });
});
