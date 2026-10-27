# Cranhua Frontend

Angular 19 con @angular/google-maps. Requiere Node 20.11.1.

## Instalar

```bash
npm install
cp src/environments/environment.example.ts src/environments/environment.ts
```

En `environment.ts` poner la API key de Google Maps. Ese archivo está en `.gitignore` y no se sube.

## Correr

```bash
npm start
```

Abrir http://localhost:4200. La ruta `/mapa-prueba` muestra un mapa de prueba.

## Probar

```bash
npm test
npm run lint
npm run format:check
npm run build
```
