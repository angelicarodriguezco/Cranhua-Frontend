import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { MENU_CAFETERIA } from '../mocks/menu-cafeteria.mock';
import { ItemMenu, NuevoItemMenu } from '../models/menu-cafeteria.model';

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class MenuCafeteriaService {
  private items: ItemMenu[] = MENU_CAFETERIA.map((i) => ({ ...i }));
  private siguienteId = this.items.length + 1;

  listar(): Observable<ItemMenu[]> {
    return of([...this.items]);
  }

  publicar(nuevo: NuevoItemMenu): Observable<ItemMenu> {
    const item: ItemMenu = { ...nuevo, id: `menu-${this.siguienteId++}` };
    this.items = [item, ...this.items];
    return of(item);
  }

  quitar(id: string): Observable<void> {
    this.items = this.items.filter((i) => i.id !== id);
    return of(undefined);
  }
}
