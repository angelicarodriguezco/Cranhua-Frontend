import { Coordenada } from '../../core/models/finca.model';

// Cálculos planos sobre lat/lng. Para el tamaño de una finca el error es despreciable;
// la validación definitiva la hace PostGIS en el backend.

const RADIO_TIERRA_M = 6_371_008.8;
const M2_POR_HECTAREA = 10_000;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

export function areaHectareas(perimetro: Coordenada[]): number {
  if (perimetro.length < 3) {
    return 0;
  }
  const latMedia = aRadianes(perimetro.reduce((suma, p) => suma + p.lat, 0) / perimetro.length);
  const puntos = perimetro.map((p) => ({
    x: aRadianes(p.lng) * RADIO_TIERRA_M * Math.cos(latMedia),
    y: aRadianes(p.lat) * RADIO_TIERRA_M,
  }));
  let doble = 0;
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i];
    const b = puntos[(i + 1) % puntos.length];
    doble += a.x * b.y - b.x * a.y;
  }
  return Math.abs(doble) / 2 / M2_POR_HECTAREA;
}

export function centroide(perimetro: Coordenada[]): Coordenada {
  // Se calcula relativo al primer vértice: con coordenadas absolutas los productos pierden precisión
  const origen = perimetro[0];
  let doble = 0;
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < perimetro.length; i++) {
    const a = { lat: perimetro[i].lat - origen.lat, lng: perimetro[i].lng - origen.lng };
    const siguiente = perimetro[(i + 1) % perimetro.length];
    const b = { lat: siguiente.lat - origen.lat, lng: siguiente.lng - origen.lng };
    const cruz = a.lng * b.lat - b.lng * a.lat;
    doble += cruz;
    lng += (a.lng + b.lng) * cruz;
    lat += (a.lat + b.lat) * cruz;
  }
  if (Math.abs(doble) < 1e-14) {
    // Con menos de tres puntos (o todos alineados) no hay área: se usa el promedio
    return {
      lat: perimetro.reduce((suma, p) => suma + p.lat, 0) / perimetro.length,
      lng: perimetro.reduce((suma, p) => suma + p.lng, 0) / perimetro.length,
    };
  }
  return { lat: origen.lat + lat / (3 * doble), lng: origen.lng + lng / (3 * doble) };
}

export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const x = aRadianes(b.lng - a.lng) * Math.cos(aRadianes((a.lat + b.lat) / 2));
  const y = aRadianes(b.lat - a.lat);
  return (Math.hypot(x, y) * RADIO_TIERRA_M) / 1000;
}

// Tolerancia para tratar como alineados puntos que solo difieren por redondeo
const EPSILON = 1e-14;

function orientacion(a: Coordenada, b: Coordenada, c: Coordenada): number {
  const cruz = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
  return Math.abs(cruz) < EPSILON ? 0 : Math.sign(cruz);
}

function sobreSegmento(p: Coordenada, a: Coordenada, b: Coordenada): boolean {
  return (
    orientacion(a, b, p) === 0 &&
    p.lat >= Math.min(a.lat, b.lat) &&
    p.lat <= Math.max(a.lat, b.lat) &&
    p.lng >= Math.min(a.lng, b.lng) &&
    p.lng <= Math.max(a.lng, b.lng)
  );
}

// Solo cruces propios: dos lados que apenas se tocan en un extremo no cuentan
function segmentosSeCruzan(a: Coordenada, b: Coordenada, c: Coordenada, d: Coordenada): boolean {
  const o1 = orientacion(a, b, c);
  const o2 = orientacion(a, b, d);
  const o3 = orientacion(c, d, a);
  const o4 = orientacion(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function lados(perimetro: Coordenada[]): [Coordenada, Coordenada][] {
  return perimetro.map((p, i) => [p, perimetro[(i + 1) % perimetro.length]]);
}

export function puntoDentro(punto: Coordenada, perimetro: Coordenada[]): boolean {
  let dentro = false;
  for (const [a, b] of lados(perimetro)) {
    const cruzaLatitud = a.lat > punto.lat !== b.lat > punto.lat;
    if (cruzaLatitud) {
      const lngCorte = a.lng + ((punto.lat - a.lat) / (b.lat - a.lat)) * (b.lng - a.lng);
      if (punto.lng < lngCorte) {
        dentro = !dentro;
      }
    }
  }
  return dentro;
}

export function seCruzaConsigoMismo(perimetro: Coordenada[]): boolean {
  const todos = lados(perimetro);
  for (let i = 0; i < todos.length; i++) {
    for (let j = i + 2; j < todos.length; j++) {
      // El primer y el último lado comparten vértice
      if (i === 0 && j === todos.length - 1) {
        continue;
      }
      if (segmentosSeCruzan(...todos[i], ...todos[j])) {
        return true;
      }
    }
  }
  return false;
}

export function seSuperponen(a: Coordenada[], b: Coordenada[]): boolean {
  if (a.length < 3 || b.length < 3) {
    return false;
  }
  const ladosB = lados(b);
  const hayCruce = lados(a).some(([p, q]) =>
    ladosB.some(([r, s]) => segmentosSeCruzan(p, q, r, s)),
  );
  // Los puntos sobre el borde no cuentan: dos fincas vecinas pueden compartir un lindero
  const adentro = (p: Coordenada, perimetro: Coordenada[]) =>
    !lados(perimetro).some(([r, s]) => sobreSegmento(p, r, s)) && puntoDentro(p, perimetro);
  return (
    hayCruce ||
    a.some((p) => adentro(p, b)) ||
    b.some((p) => adentro(p, a)) ||
    // Polígonos idénticos no tienen cruces ni vértices estrictamente adentro
    adentro(centroide(a), b)
  );
}
