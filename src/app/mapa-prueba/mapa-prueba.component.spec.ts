import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MapaPruebaComponent } from './mapa-prueba.component';

describe('MapaPruebaComponent', () => {
  let component: MapaPruebaComponent;
  let fixture: ComponentFixture<MapaPruebaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaPruebaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaPruebaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
