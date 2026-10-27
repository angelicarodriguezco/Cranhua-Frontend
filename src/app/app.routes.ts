import { Routes } from '@angular/router';
import { MapaPruebaComponent } from './mapa-prueba/mapa-prueba.component';

// Vista provisional hasta tener las pantallas reales
export const routes: Routes = [
  { path: 'mapa-prueba', component: MapaPruebaComponent },
  { path: '', redirectTo: 'mapa-prueba', pathMatch: 'full' },
];
