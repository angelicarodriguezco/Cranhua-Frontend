import { Coordenada } from '../../core/models/finca.model';
import { areaHectareas, centroide, puntoDentro, seCruzaConsigoMismo, seSuperponen } from './geo';

// Cuadrado de ~100 m de lado cerca de San Marcos de Tarrazú
const LADO_GRADOS_LAT = 100 / 111_195;
const LADO_GRADOS_LNG = LADO_GRADOS_LAT / Math.cos((9.65 * Math.PI) / 180);

function cuadrado(lat: number, lng: number, escala = 1): Coordenada[] {
  const dLat = LADO_GRADOS_LAT * escala;
  const dLng = LADO_GRADOS_LNG * escala;
  return [
    { lat, lng },
    { lat, lng: lng + dLng },
    { lat: lat + dLat, lng: lng + dLng },
    { lat: lat + dLat, lng },
  ];
}

describe('geo', () => {
  it('calcula el área en hectáreas', () => {
    expect(areaHectareas(cuadrado(9.65, -84.02))).toBeCloseTo(1, 2);
    expect(areaHectareas(cuadrado(9.65, -84.02, 2))).toBeCloseTo(4, 2);
  });

  it('no tiene área con menos de tres puntos', () => {
    expect(areaHectareas(cuadrado(9.65, -84.02).slice(0, 2))).toBe(0);
  });

  it('el centroide de un cuadrado es su centro', () => {
    const centro = centroide(cuadrado(9.65, -84.02));
    expect(centro.lat).toBeCloseTo(9.65 + LADO_GRADOS_LAT / 2, 8);
    expect(centro.lng).toBeCloseTo(-84.02 + LADO_GRADOS_LNG / 2, 8);
  });

  it('detecta si un punto está adentro', () => {
    const base = cuadrado(9.65, -84.02);
    expect(puntoDentro(centroide(base), base)).toBeTrue();
    expect(puntoDentro({ lat: 9.64, lng: -84.02 }, base)).toBeFalse();
  });

  it('detecta un perímetro que se cruza consigo mismo', () => {
    const [a, b, c, d] = cuadrado(9.65, -84.02);
    expect(seCruzaConsigoMismo([a, b, c, d])).toBeFalse();
    expect(seCruzaConsigoMismo([a, c, b, d])).toBeTrue();
  });

  describe('seSuperponen', () => {
    const base = cuadrado(9.65, -84.02);

    it('con lados que se cruzan', () => {
      const corrido = cuadrado(9.65 + LADO_GRADOS_LAT / 2, -84.02 + LADO_GRADOS_LNG / 2);
      expect(seSuperponen(base, corrido)).toBeTrue();
    });

    it('cuando uno contiene al otro', () => {
      const adentro = cuadrado(9.65 + LADO_GRADOS_LAT / 4, -84.02 + LADO_GRADOS_LNG / 4, 0.5);
      expect(seSuperponen(base, adentro)).toBeTrue();
      expect(seSuperponen(adentro, base)).toBeTrue();
    });

    it('cuando son iguales', () => {
      expect(seSuperponen(base, [...base])).toBeTrue();
    });

    it('no con fincas vecinas que comparten un lado', () => {
      const vecina = cuadrado(9.65, -84.02 + LADO_GRADOS_LNG);
      expect(seSuperponen(base, vecina)).toBeFalse();
    });

    it('no con fincas separadas', () => {
      expect(seSuperponen(base, cuadrado(9.66, -84.02))).toBeFalse();
    });
  });
});
