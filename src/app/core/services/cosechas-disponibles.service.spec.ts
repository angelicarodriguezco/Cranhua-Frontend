import { COSECHAS_DISPONIBLES } from '../mocks/cosechas-disponibles.mock';
import { SIN_FILTROS } from '../models/cosecha-disponible.model';
import { filtrarCosechas } from './cosechas-disponibles.service';

describe('filtrarCosechas', () => {
  const ids = (filtros: Partial<typeof SIN_FILTROS>) =>
    filtrarCosechas(COSECHAS_DISPONIBLES, { ...SIN_FILTROS, ...filtros }).map((c) => c.id);

  it('sin filtros devuelve todas', () => {
    expect(ids({})).toHaveSize(COSECHAS_DISPONIBLES.length);
  });

  it('"Disponible ahora" deja fuera las próximas', () => {
    expect(ids({ soloDisponibles: true })).not.toContain('cosecha-sl28-quebrada-honda');
    expect(ids({ soloDisponibles: true })).toHaveSize(6);
  });

  it('filtra por zona', () => {
    expect(ids({ zona: 'Tarrazú' })).toEqual([
      'cosecha-caturra-catalina',
      'cosecha-geisha-monte-alto',
    ]);
  });

  it('"Notas florales" busca al menos una nota floral', () => {
    expect(ids({ soloFlorales: true })).toEqual([
      'cosecha-caturra-catalina',
      'cosecha-geisha-monte-alto',
      'cosecha-sl28-quebrada-honda',
      'cosecha-bourbon-cerro-verde',
      'cosecha-caturra-el-mirador',
    ]);
  });

  it('combina filtros', () => {
    expect(ids({ soloHoney: true, soloDisponibles: true })).toEqual([
      'cosecha-caturra-catalina',
      'cosecha-bourbon-cerro-verde',
    ]);
  });
});
