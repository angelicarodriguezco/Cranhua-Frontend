import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CANTONES, FINCAS_REGISTRADAS, USUARIOS } from '../mocks/finca.mock';
import {
  Canton,
  Coordenada,
  Finca,
  NuevaFinca,
  ResultadoAgregarDueno,
  ResultadoRegistro,
  Usuario,
} from '../models/finca.model';
import { distanciaKm, seSuperponen } from '../../shared/utils/geo';

// Más lejos que esto de la cabecera más cercana se considera fuera de los cantones de ejemplo
const DISTANCIA_MAXIMA_CANTON_KM = 25;

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class FincaService {
  private fincas = [...FINCAS_REGISTRADAS];

  registrar(nueva: NuevaFinca): Observable<ResultadoRegistro> {
    const conflicto = this.fincas.find((f) => seSuperponen(nueva.perimetro, f.perimetro));
    if (conflicto) {
      return of({ registrada: false, conflicto });
    }
    const finca = { ...nueva, id: `f-${Date.now()}` };
    this.fincas.push(finca);
    return of({ registrada: true, finca });
  }

  buscarUsuarioPorCorreo(correo: string): Observable<Usuario | undefined> {
    const buscado = normalizar(correo);
    return of(USUARIOS.find((u) => u.correo === buscado));
  }

  cantonDe(punto: Coordenada): Canton | null {
    let masCercano: Canton | null = null;
    let menorDistancia = DISTANCIA_MAXIMA_CANTON_KM;
    for (const canton of CANTONES) {
      const distancia = distanciaKm(punto, canton.cabecera);
      if (distancia < menorDistancia) {
        masCercano = canton;
        menorDistancia = distancia;
      }
    }
    return masCercano;
  }

  buscarCanton(nombre: string): Canton | undefined {
    const buscado = normalizar(nombre);
    return (
      CANTONES.find((c) => normalizar(c.nombre) === buscado) ??
      CANTONES.find((c) => normalizar(c.nombre).startsWith(buscado))
    );
  }

  misFincas(usuarioId: string): Observable<Finca[]> {
    return of(
      this.fincas.filter(
        (f) => f.propietarioId === usuarioId || f.duenosAdicionales.some((u) => u.id === usuarioId),
      ),
    );
  }

  obtener(id: string): Observable<Finca | undefined> {
    return of(this.fincas.find((f) => f.id === id));
  }

  usuarioPorId(id: string): Usuario | undefined {
    return USUARIOS.find((u) => u.id === id);
  }

  // Se reemplaza la finca por una copia para no modificar los datos de ejemplo
  agregarDueno(fincaId: string, correo: string): Observable<ResultadoAgregarDueno> {
    const indice = this.fincas.findIndex((f) => f.id === fincaId);
    if (indice === -1) {
      return of({ agregado: false, error: 'finca-inexistente' });
    }
    const buscado = normalizar(correo);
    const usuario = USUARIOS.find((u) => u.correo === buscado);
    if (!usuario) {
      return of({ agregado: false, error: 'correo-inexistente' });
    }
    const finca = this.fincas[indice];
    if (
      finca.propietarioId === usuario.id ||
      finca.duenosAdicionales.some((u) => u.id === usuario.id)
    ) {
      return of({ agregado: false, error: 'ya-es-dueno' });
    }
    const actualizada = { ...finca, duenosAdicionales: [...finca.duenosAdicionales, usuario] };
    this.fincas[indice] = actualizada;
    return of({ agregado: true, finca: actualizada });
  }
}
