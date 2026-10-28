# Cranhua Frontend

Angular 19 con @angular/google-maps. Requiere Node 20.11.1.

## Instalar

```bash
npm install
cp .env.example .env
```

En `.env` poner la API key de Google Maps en `GOOGLE_MAPS_API_KEY`. El `.env` no se sube. `npm start`, `npm run build` y `npm test` generan `src/environments/environment.ts` a partir de ese valor.

## Correr

```bash
npm start
```

Abrir http://localhost:4200. La ruta `/mapa-prueba` muestra un mapa de prueba y `/onboarding-finca` el registro de la primera finca del cafetalero, con datos de ejemplo de `src/app/core/mocks/finca.mock.ts`.

## Probar

```bash
npm test
npm run lint
npm run format:check
npm run build
```
