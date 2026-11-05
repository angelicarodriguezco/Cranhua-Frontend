import { Routes } from '@angular/router';

import { DashboardCafeteriaComponent } from './features/dashboard-cafeteria/dashboard-cafeteria.component';
import { DashboardCafetaleroComponent } from './features/dashboard-cafetalero/dashboard-cafetalero.component';
import { DashboardConsumidorComponent } from './features/dashboard-consumidor/dashboard-consumidor.component';
import { DashboardTostadorComponent } from './features/dashboard-tostador/dashboard-tostador.component';
import { DetalleCosechaComponent } from './features/detalle-cosecha/detalle-cosecha.component';
import { DetalleFincaComponent } from './features/detalle-finca/detalle-finca.component';
import { ExplorarCosechasComponent } from './features/explorar-cosechas/explorar-cosechas.component';
import { FormularioTuesteComponent } from './features/formulario-tueste/formulario-tueste.component';
import { HistorialCafetaleroComponent } from './features/historial-cafetalero/historial-cafetalero.component';
import { IniciarSesionComponent } from './features/iniciar-sesion/iniciar-sesion.component';
import { InicioComponent } from './features/inicio/inicio.component';
import { MapaPruebaComponent } from './features/mapa-prueba/mapa-prueba.component';
import { MiCafeteriaComponent } from './features/mi-cafeteria/mi-cafeteria.component';
import { MiNegocioComponent } from './features/mi-negocio/mi-negocio.component';
import { OnboardingCafeteriaComponent } from './features/onboarding-cafeteria/onboarding-cafeteria.component';
import { OnboardingFincaComponent } from './features/onboarding-finca/onboarding-finca.component';
import { RegistroComponent } from './features/registro/registro.component';
import { OnboardingTostadorComponent } from './features/onboarding-tostador/onboarding-tostador.component';
import { PerfilUsuarioComponent } from './features/perfil-usuario/perfil-usuario.component';
import { RecuperarContrasenaComponent } from './features/recuperar-contrasena/recuperar-contrasena.component';
import { RegistrarCosechaComponent } from './features/registrar-cosecha/registrar-cosecha.component';
import { RegistrarFincaComponent } from './features/registrar-finca/registrar-finca.component';
import { PaginaMockComponent } from './shared/components/pagina-mock/pagina-mock.component';
import { MisFincasComponent } from './features/mis-fincas/mis-fincas.component';
import { MisTostadosComponent } from './features/mis-tostados/mis-tostados.component';
import { MisPedidosComponent } from './features/mis-pedidos/mis-pedidos.component';
import { MisSolicitudesComponent } from './features/mis-solicitudes/mis-solicitudes.component';
import { ExplorarTostadoresComponent } from './features/explorar-tostadores/explorar-tostadores.component';
import { PublicarMenuComponent } from './features/publicar-menu/publicar-menu.component';
import { DetalleTostadorComponent } from './features/detalle-tostador/detalle-tostador.component';
import { RegistrarCafeteriaComponent } from './features/registrar-cafeteria/registrar-cafeteria.component';
import { conCafeteriaGuard, sinCafeteriaGuard } from './core/guards/cafeteria.guard';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'explorar', component: DashboardConsumidorComponent },
  {
    path: 'explorar/finca/:id',
    component: PaginaMockComponent,
    data: { title: 'Perfil público de finca' },
  },
  {
    path: 'explorar/tostador/:id',
    component: PaginaMockComponent,
    data: { title: 'Perfil público de tostador' },
  },
  {
    path: 'explorar/cafeteria/:id',
    component: PaginaMockComponent,
    data: { title: 'Perfil público de cafetería' },
  },
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
  { path: 'onboarding-tostador', component: OnboardingTostadorComponent },
  { path: 'onboarding-cafeteria', component: OnboardingCafeteriaComponent },
  { path: 'mapa-prueba', component: MapaPruebaComponent },
  { path: 'perfil', component: PerfilUsuarioComponent },
  { path: 'cafetalero/dashboard', component: DashboardCafetaleroComponent },
  { path: 'cafetalero/fincas', component: MisFincasComponent },
  { path: 'cafetalero/fincas/registrar', component: RegistrarFincaComponent },
  { path: 'cafetalero/fincas/:id', component: DetalleFincaComponent },
  {
    path: 'cafetalero/fincas/:id/editar',
    component: PaginaMockComponent,
    data: { title: 'Editar finca' },
  },
  { path: 'cafetalero/registrar-cosecha', component: RegistrarCosechaComponent },
  { path: 'cafetalero/cosechas/:id/editar', component: RegistrarCosechaComponent },
  { path: 'cafetalero/historial', component: HistorialCafetaleroComponent },
  { path: 'dashboard', redirectTo: 'cafetalero/dashboard', pathMatch: 'full' },
  { path: 'mis-fincas', redirectTo: 'cafetalero/fincas', pathMatch: 'full' },
  { path: 'mis-fincas/registrar', redirectTo: 'cafetalero/fincas/registrar', pathMatch: 'full' },
  { path: 'fincas/:id', redirectTo: 'cafetalero/fincas/:id' },
  { path: 'registrar-cosecha', redirectTo: 'cafetalero/registrar-cosecha', pathMatch: 'full' },
  { path: 'cosechas/:id/editar', redirectTo: 'cafetalero/cosechas/:id/editar' },
  { path: 'historial', redirectTo: 'cafetalero/historial', pathMatch: 'full' },
  { path: 'tostador/dashboard', component: DashboardTostadorComponent },
  { path: 'tostador/cosechas', component: ExplorarCosechasComponent },
  { path: 'tostador/cosechas/:id', component: DetalleCosechaComponent },
  { path: 'tostador/solicitudes', component: MisSolicitudesComponent },
  { path: 'tostador/tostados', component: MisTostadosComponent },
  { path: 'tostador/tostados/nuevo', component: FormularioTuesteComponent },
  { path: 'tostador/tostados/:id/editar', component: FormularioTuesteComponent },
  { path: 'tostador/negocio', component: MiNegocioComponent },

  {
    path: 'cafeteria/registrar',
    component: RegistrarCafeteriaComponent,
    canActivate: [sinCafeteriaGuard],
  },
  {
    path: 'cafeteria',
    canActivateChild: [conCafeteriaGuard],
    children: [
      { path: 'dashboard', component: DashboardCafeteriaComponent },
      { path: 'tostadores', component: ExplorarTostadoresComponent },
      { path: 'tostadores/:id', component: DetalleTostadorComponent },
      { path: 'pedidos', component: MisPedidosComponent },
      { path: 'mi-cafeteria', component: MiCafeteriaComponent },
      {
        path: 'menu',
        component: PaginaMockComponent,
        data: { title: 'Publicar en el menú' },
      },
      { path: 'menu', component: PublicarMenuComponent },
    ],
  },
];
