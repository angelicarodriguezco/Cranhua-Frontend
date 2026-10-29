import { Routes } from '@angular/router';

import { DashboardCafetaleroComponent } from './features/dashboard-cafetalero/dashboard-cafetalero.component';
import { IniciarSesionComponent } from './features/iniciar-sesion/iniciar-sesion.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { OnboardingCafeteriaComponent } from './features/onboarding-cafeteria/onboarding-cafeteria.component';
import { OnboardingFincaComponent } from './features/onboarding-finca/onboarding-finca.component';
import { RegistroComponent } from './features/registro/registro.component';
import { OnboardingTostadorComponent } from './features/onboarding-tostador/onboarding-tostador.component';
import { RecuperarContrasenaComponent } from './features/recuperar-contrasena/recuperar-contrasena.component';
import { RegistrarFincaComponent } from './features/registrar-finca/registrar-finca.component';
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
  {
    path: 'recuperar-contrasena',
    component: RecuperarContrasenaComponent,
    data: { title: 'Recuperar contraseña' },
  },
  { path: 'onboarding-finca', component: OnboardingFincaComponent },
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
  { path: 'onboarding-cafeteria', component: OnboardingCafeteriaComponent },
  { path: 'dashboard', component: DashboardCafetaleroComponent },
  { path: 'mis-fincas', component: PaginaMockComponent, data: { title: 'Mis fincas' } },
  { path: 'mis-fincas/registrar', component: RegistrarFincaComponent },
  {
    path: 'fincas/:id',
    component: PaginaMockComponent,
    data: { title: 'Detalle de finca' },
  },
  {
    path: 'registrar-cosecha',
    component: PaginaMockComponent,
    data: { title: 'Registrar cosecha' },
  },
  { path: 'historial', component: PaginaMockComponent, data: { title: 'Historial' } },
  { path: 'perfil', component: PaginaMockComponent, data: { title: 'Perfil y ajustes' } },
  { path: 'mapa-prueba', component: MapaPruebaComponent },
  { path: 'onboarding-tostador', component: OnboardingTostadorComponent },
  {
    path: 'tostador/dashboard',
    component: PaginaMockComponent,
    data: { title: 'Dashboard del tostador' },
  },
];