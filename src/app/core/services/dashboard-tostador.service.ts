import { Injectable, signal } from '@angular/core';

import { INDICADORES_TOSTADOR } from '../mocks/dashboard-tostador.mock';
import { TOSTADOR_ACTUAL } from '../mocks/negocio-tueste.mock';
import { TemaDashboard } from '../models/dashboard-cafetalero.model';
import { IndicadoresTostador, PerfilTostadorSidebar } from '../models/dashboard-tostador.model';
import { iniciales, nombreCorto } from '../../shared/utils/formato';

@Injectable({ providedIn: 'root' })
export class DashboardTostadorService {
  private readonly temaActual = signal<TemaDashboard>('oscuro');

  readonly tostador = TOSTADOR_ACTUAL;
  readonly perfilSidebar: PerfilTostadorSidebar = {
    iniciales: iniciales(TOSTADOR_ACTUAL),
    nombreCompleto: nombreCorto(TOSTADOR_ACTUAL),
    rol: 'Tostador',
  };
  readonly indicadores: IndicadoresTostador = INDICADORES_TOSTADOR;
  readonly tema = this.temaActual.asReadonly();

  alternarTema(): void {
    this.temaActual.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }
}
