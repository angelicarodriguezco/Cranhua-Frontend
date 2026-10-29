import { Routes } from '@angular/router';

import { IniciarSesionComponent } from './features/iniciar-sesion/iniciar-sesion.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { OnboardingFincaComponent } from './features/onboarding-finca/onboarding-finca.component';
import { RecuperarContrasenaComponent } from './features/recuperar-contrasena/recuperar-contrasena.component';
import { PaginaMockComponent } from './shared/components/pagina-mock/pagina-mock.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'registro', component: PaginaMockComponent, data: { title: 'Registro' } },
  { path: 'explorar', component: PaginaMockComponent, data: { title: 'Explorar' } },
  {
    path: 'iniciar-sesion',
    component: IniciarSesionComponent,
    data: { title: 'Iniciar Sesión' },
  },
  {
    path: 'recuperar-contrasena',
    component: RecuperarContrasenaComponent,
    data: { title: 'Recuperar contraseña' },
  },
  { path: 'onboarding-finca', component: OnboardingFincaComponent },
  { path: 'dashboard', component: PaginaMockComponent, data: { title: 'Dashboard' } },
  { path: 'mapa-prueba', component: MapaPruebaComponent },
];
