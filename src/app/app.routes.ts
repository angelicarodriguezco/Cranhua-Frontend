import { Routes } from '@angular/router';

import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { PaginaMockComponent } from './shared/components/pagina-mock/pagina-mock.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'registro', component: PaginaMockComponent, data: { title: 'Registro' } },
  { path: 'explorar', component: PaginaMockComponent, data: { title: 'Explorar' } },
  {
    path: 'iniciar-sesion',
    component: PaginaMockComponent,
    data: { title: 'Iniciar Sesión' },
  },
  { path: 'mapa-prueba', component: MapaPruebaComponent },
];
