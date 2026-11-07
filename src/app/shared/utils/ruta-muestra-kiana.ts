const RUTAS_OCULTAR_KIANA = new Set([
  '/',
  '/iniciar-sesion',
  '/registro',
  '/recuperar-contrasena',
  '/onboarding-finca',
  '/onboarding-tostador',
  '/onboarding-cafeteria',
  '/perfil',
]);

export function normalizarRutaKiana(url: string): string {
  const sinFragmento = url.split('#')[0] ?? url;
  const sinQuery = sinFragmento.split('?')[0] ?? sinFragmento;
  if (sinQuery.length > 1 && sinQuery.endsWith('/')) {
    return sinQuery.slice(0, -1);
  }
  return sinQuery || '/';
}

export function rutaMuestraKiana(url: string): boolean {
  return !RUTAS_OCULTAR_KIANA.has(normalizarRutaKiana(url));
}
