import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppComponent } from './app.component';

@Component({ template: '', standalone: true })
class RutaVaciaComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '**', component: RutaVaciaComponent }])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'cranhua-frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('cranhua-frontend');
  });

  it('oculta Kiana en rutas de la denylist y la muestra en el resto', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeNull();

    await router.navigateByUrl('/perfil');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeNull();

    await router.navigateByUrl('/explorar');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeTruthy();

    await router.navigateByUrl('/explorar/cafeteria/1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeTruthy();

    await router.navigateByUrl('/explorar/cafeteria/1/menu');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeTruthy();

    await router.navigateByUrl('/iniciar-sesion');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-kiana-widget')).toBeNull();
  });
});
