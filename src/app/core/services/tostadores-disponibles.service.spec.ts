import { TOSTADORES_DISPONIBLES } from '../mocks/tostadores-disponibles.mock';
import { SIN_FILTROS } from '../models/tostador-disponible.model';
import { filtrarTostadores } from './tostadores-disponibles.service';

describe('filtrarTostadores', () => {
  const ids = (filtros: Partial<typeof SIN_FILTROS>) =>
    filtrarTostadores(TOSTADORES_DISPONIBLES, { ...SIN_FILTROS, ...filtros }).map((t) => t.id);

  it('sin filtros devuelve todos', () => {
    expect(ids({})).toHaveSize(TOSTADORES_DISPONIBLES.length);
  });

  it('filtra por estilo Claro', () => {
    expect(ids({ estilo: 'Claro' })).toEqual([
      'tostador-volcan',
      'tostador-nube-alta',
      'tostador-grano-vivo',
      'tostador-origen-puro',
    ]);
  });

  it('filtra por estilo Medio', () => {
    expect(ids({ estilo: 'Medio' })).toEqual([
      'tostador-volcan',
      'tostador-cerro-azul',
      'tostador-grano-vivo',
      'tostador-brisas-del-sur',
    ]);
  });

  it('filtra por estilo Oscuro', () => {
    expect(ids({ estilo: 'Oscuro' })).toEqual([
      'tostador-cerro-azul',
      'tostador-fuego-lento',
      'tostador-grano-vivo',
      'tostador-origen-puro',
    ]);
  });

  it('"Con café disponible" deja fuera los sin kg', () => {
    expect(ids({ soloConCafe: true })).not.toContain('tostador-brisas-del-sur');
    expect(ids({ soloConCafe: true })).toHaveSize(6);
  });

  it('combina estilo y café disponible', () => {
    expect(ids({ estilo: 'Medio', soloConCafe: true })).toEqual([
      'tostador-volcan',
      'tostador-cerro-azul',
      'tostador-grano-vivo',
    ]);
  });
});
