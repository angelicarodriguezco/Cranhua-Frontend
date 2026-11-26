import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IndicadoresTostador } from '../models/dashboard-tostador.model';

import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardTostadorService {
  private readonly http = inject(HttpClient);
  private readonly temas = inject(TemaService);

  readonly tema = this.temas.tema;

  obtenerIndicadores(): Observable<IndicadoresTostador> {
    return this.http.get<IndicadoresTostador>(`${environment.apiUrl}/api/tostador/dashboard`, {
      withCredentials: true,
    });
  }

  alternarTema(): void {
    this.temas.alternarTema();
  }
}
