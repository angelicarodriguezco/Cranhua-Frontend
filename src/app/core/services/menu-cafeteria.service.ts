import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { cuerpoPublicarItemMenu, itemMenuDesdeApi } from '../mappers/menu-cafeteria.mapper';
import { ItemMenu, ItemMenuResponseApi, NuevoItemMenu } from '../models/menu-cafeteria.model';
import { CafeteriaService } from './cafeteria.service';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class MenuCafeteriaService {
  private readonly http = inject(HttpClient);
  private readonly cafeterias = inject(CafeteriaService);

  private get base(): string {
    return `${environment.apiUrl}/api/cafeterias`;
  }

  listar(): Observable<ItemMenu[]> {
    return this.conCafeteriaId((id) =>
      this.http
        .get<ItemMenuResponseApi[]>(`${this.base}/${id}/menu`, opcionesCredenciales)
        .pipe(map((items) => items.map(itemMenuDesdeApi))),
    );
  }

  publicar(nuevo: NuevoItemMenu): Observable<ItemMenu> {
    return this.conCafeteriaId((id) =>
      this.http
        .post<ItemMenuResponseApi>(
          `${this.base}/${id}/menu`,
          cuerpoPublicarItemMenu(nuevo),
          opcionesCredenciales,
        )
        .pipe(map(itemMenuDesdeApi)),
    );
  }

  quitar(itemId: string): Observable<void> {
    return this.conCafeteriaId((id) =>
      this.http.delete<void>(`${this.base}/${id}/menu/${itemId}`, opcionesCredenciales),
    );
  }

  private conCafeteriaId<T>(operacion: (cafeteriaId: string) => Observable<T>): Observable<T> {
    return this.cafeterias.obtenerActual().pipe(
      switchMap((cafeteria) => {
        if (!cafeteria) {
          return throwError(() => new Error('No hay una cafetería registrada.'));
        }
        return operacion(cafeteria.id);
      }),
    );
  }
}
