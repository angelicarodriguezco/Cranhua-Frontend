import { Routes } from '@angular/router';

import { IniciarSesionComponent } from './features/iniciar-sesion/iniciar-sesion.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { OnboardingFincaComponent } from './features/onboarding-finca/onboarding-finca.component';
import { RegistroComponent } from './features/registro/registro.component';
import { PaginaMockComponent } from './shared/components/pagina-mock/pagina-mock.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'explorar', component: PaginaMockComponent, data: { title: 'Explorar' } },
  {
    path: 'iniciar-sesion',
    component: IniciarSesionComponent,
    data: { title: 'Iniciar Sesión' },
  },
  { path: 'onboarding-finca', component: OnboardingFincaComponent },
  // Placeholders hasta que se hagan CP3-82 y CP3-83
  {
    path: 'onboarding-tostador',
    component: PaginaMockComponent,
    data: { title: 'Onboarding: Registrar negocio de tueste' },
  },
  {
    path: 'onboarding-cafeteria',
    component: PaginaMockComponent,
    data: { title: 'Onboarding: Registrar cafetería' },
  },
  { path: 'dashboard', component: PaginaMockComponent, data: { title: 'Dashboard' } },
  { path: 'mapa-prueba', component: MapaPruebaComponent },
];
