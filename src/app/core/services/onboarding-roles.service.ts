import { Injectable } from '@angular/core';

import {
  ORDEN_ROLES,
  RolCuenta,
  RUTA_DASHBOARD_POR_ROL,
  RUTA_ONBOARDING_POR_ROL,
} from '../models/cuenta.model';

export const CLAVE_ONBOARDING_ROLES = 'cranhua-onboarding-roles';

interface EstadoOnboardingRoles {
  rolesSeleccionados: RolCuenta[];
  rolesPendientes: RolCuenta[];
}

function esRolCuenta(valor: unknown): valor is RolCuenta {
  return valor === 'cafetalero' || valor === 'tostador' || valor === 'cafeteria';
}

function leerEstado(): EstadoOnboardingRoles | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_ONBOARDING_ROLES);
    if (!crudo) {
      return null;
    }
    const parseado = JSON.parse(crudo) as Partial<EstadoOnboardingRoles>;
    const seleccionados = Array.isArray(parseado.rolesSeleccionados)
      ? parseado.rolesSeleccionados.filter(esRolCuenta)
      : [];
    const pendientes = Array.isArray(parseado.rolesPendientes)
      ? parseado.rolesPendientes.filter(esRolCuenta)
      : [];
    if (seleccionados.length === 0) {
      return null;
    }
    return { rolesSeleccionados: seleccionados, rolesPendientes: pendientes };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class OnboardingRolesService {
  private rolesSeleccionados: RolCuenta[] = [];
  private rolesPendientes: RolCuenta[] = [];

  constructor() {
    const guardado = leerEstado();
    if (guardado) {
      this.rolesSeleccionados = guardado.rolesSeleccionados;
      this.rolesPendientes = guardado.rolesPendientes;
    }
  }

  iniciar(rolesSeleccionados: readonly RolCuenta[]): void {
    const ordenados = ORDEN_ROLES.filter((rol) => rolesSeleccionados.includes(rol));
    this.rolesSeleccionados = ordenados;
    this.rolesPendientes = ordenados.slice(1);
    this.persistir();
  }

  progreso(): { actual: number; total: number } {
    const total = this.rolesSeleccionados.length;
    return { actual: total - this.rolesPendientes.length, total };
  }

  hayCadena(): boolean {
    return this.rolesSeleccionados.length > 1;
  }

  siguienteRuta(): string | null {
    const siguiente = this.rolesPendientes[0];
    return siguiente ? RUTA_ONBOARDING_POR_ROL[siguiente] : null;
  }

  completarRolActual(): void {
    if (this.rolesPendientes.length === 0) {
      this.limpiar();
      return;
    }
    this.rolesPendientes = this.rolesPendientes.slice(1);
    this.persistir();
  }

  destinoTrasCompletar(rolActual: RolCuenta): string {
    return this.siguienteRuta() ?? RUTA_DASHBOARD_POR_ROL[rolActual];
  }

  limpiar(): void {
    this.rolesSeleccionados = [];
    this.rolesPendientes = [];
    try {
      sessionStorage.removeItem(CLAVE_ONBOARDING_ROLES);
    } catch {
      // sessionStorage puede fallar en modo privado
    }
  }

  private persistir(): void {
    try {
      if (this.rolesSeleccionados.length === 0) {
        sessionStorage.removeItem(CLAVE_ONBOARDING_ROLES);
        return;
      }
      const estado: EstadoOnboardingRoles = {
        rolesSeleccionados: this.rolesSeleccionados,
        rolesPendientes: this.rolesPendientes,
      };
      sessionStorage.setItem(CLAVE_ONBOARDING_ROLES, JSON.stringify(estado));
    } catch {
      // Sin sessionStorage la cola solo dura en memoria
    }
  }
}
