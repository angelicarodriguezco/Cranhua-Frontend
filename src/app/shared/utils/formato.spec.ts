import { etiquetaFinca } from './formato';

describe('etiquetaFinca', () => {
  it('antepone Finca si el nombre no la trae', () => {
    expect(etiquetaFinca('La Catalina')).toBe('Finca La Catalina');
    expect(etiquetaFinca('  Monte Alto  ')).toBe('Finca Monte Alto');
  });

  it('deja el nombre si ya empieza con Finca', () => {
    expect(etiquetaFinca('Finca La Catalina Test')).toBe('Finca La Catalina Test');
    expect(etiquetaFinca('finca el roble')).toBe('finca el roble');
  });
});
