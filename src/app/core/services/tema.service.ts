import { Injectable, signal } from '@angular/core';

import { TemaDashboard } from '../models/dashboard-cafetalero.model';

export const CLAVE_TEMA = 'cranhua-tema';

// localStorage puede fallar (modo privado, cookies bloqueadas); en ese caso se usa el oscuro
function temaGuardado(): TemaDashboard {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'oscuro';
  } catch {
    return 'oscuro';
  }
}

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly temaActual = signal<TemaDashboard>(temaGuardado());

  readonly tema = this.temaActual.asReadonly();

  alternarTema(): void {
    this.establecerTema(this.temaActual() === 'oscuro' ? 'claro' : 'oscuro');
  }

  establecerTema(tema: TemaDashboard): void {
    this.temaActual.set(tema);
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin almacenamiento el tema solo dura mientras la página esté abierta
    }
  }
}
