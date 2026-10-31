import { Routes } from '@angular/router';

import { DashboardCafetaleroComponent } from './features/dashboard-cafetalero/dashboard-cafetalero.component';
import { DashboardTostadorComponent } from './features/dashboard-tostador/dashboard-tostador.component';
import { IniciarSesionComponent } from './features/iniciar-sesion/iniciar-sesion.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { OnboardingCafeteriaComponent } from './features/onboarding-cafeteria/onboarding-cafeteria.component';
import { OnboardingFincaComponent } from './features/onboarding-finca/onboarding-finca.component';
import { RegistroComponent } from './features/registro/registro.component';
import { OnboardingTostadorComponent } from './features/onboarding-tostador/onboarding-tostador.component';
import { RecuperarContrasenaComponent } from './features/recuperar-contrasena/recuperar-contrasena.component';
import { PaginaMockComponent } from './shared/components/pagina-mock/pagina-mock.component';
import { MisFincasComponent } from './features/mis-fincas/mis-fincas.component';

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
  { path: 'tostador/dashboard', component: DashboardTostadorComponent },
  {
    path: 'tostador/cosechas',
    component: PaginaMockComponent,
    data: { title: 'Explorar cosechas' },
  },
  {
    path: 'tostador/cosechas/:id',
    component: PaginaMockComponent,
    data: { title: 'Detalle de cosecha' },
  },
  {
    path: 'tostador/solicitudes',
    component: PaginaMockComponent,
    data: { title: 'Mis solicitudes' },
  },
  { path: 'tostador/tostados', component: PaginaMockComponent, data: { title: 'Mis tostados' } },
  { path: 'tostador/negocio', component: PaginaMockComponent, data: { title: 'Mi negocio' } },

  { path: 'cafetalero/fincas', component: MisFincasComponent },
  {
    path: 'cafetalero/fincas/:id',
    component: PaginaMockComponent,
    data: { title: 'Detalle de finca' },
  },
];
