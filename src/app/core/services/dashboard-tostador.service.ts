import { Injectable, inject } from '@angular/core';

import { INDICADORES_TOSTADOR } from '../mocks/dashboard-tostador.mock';
import { IndicadoresTostador } from '../models/dashboard-tostador.model';

import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardTostadorService {
  private readonly temas = inject(TemaService);

  readonly indicadores: IndicadoresTostador = INDICADORES_TOSTADOR;
  readonly tema = this.temas.tema;

  alternarTema(): void {
    this.temas.alternarTema();
  }
}
