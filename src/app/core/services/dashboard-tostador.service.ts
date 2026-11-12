import { Injectable, inject } from '@angular/core';

import { INDICADORES_TOSTADOR } from '../mocks/dashboard-tostador.mock';
import { TOSTADOR_ACTUAL } from '../mocks/negocio-tueste.mock';
import { IndicadoresTostador, PerfilTostadorSidebar } from '../models/dashboard-tostador.model';
import { iniciales, nombreCorto } from '../../shared/utils/formato';

import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardTostadorService {
  private readonly temas = inject(TemaService);

  readonly tostador = TOSTADOR_ACTUAL;
  readonly perfilSidebar: PerfilTostadorSidebar = {
    iniciales: iniciales(TOSTADOR_ACTUAL),
    nombreCompleto: nombreCorto(TOSTADOR_ACTUAL),
    rol: 'Tostador',
  };
  readonly indicadores: IndicadoresTostador = INDICADORES_TOSTADOR;
  readonly tema = this.temas.tema;

  alternarTema(): void {
    this.temas.alternarTema();
  }
}
