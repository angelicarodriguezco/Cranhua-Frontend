# Cranhua Frontend

Frontend de Crán̈hua: Angular 19 con `@angular/google-maps`. El backend está en [Cranhua-Backend](https://github.com/angelicarodriguezco/Cranhua-Backend).

## Requisitos

- Git
- Node **20.11.1** exacto (es la versión del curso y la que usa el CI). Con nvm-windows:
  ```bash
  nvm install 20.11.1
  nvm use 20.11.1
  node -v   # v20.11.1
  ```
- Google Chrome, para correr los tests con Karma

No hace falta instalar Angular CLI global, los scripts usan el del proyecto.

## Instalar

```bash
npm ci
cp .env.example .env      # Git Bash / macOS / Linux
copy .env.example .env    # PowerShell / CMD
```

`npm ci` instala exactamente lo que dice `package-lock.json`, igual que el CI. Usar `npm install` solo cuando se agrega o actualiza una dependencia.

## Variables de entorno

| Variable              | Para qué sirve                                                                    |
| --------------------- | --------------------------------------------------------------------------------- |
| `GOOGLE_MAPS_API_KEY` | Llave de la Maps JavaScript API. Sin ella la app corre, pero los mapas no cargan. |

`npm start`, `npm run build` y `npm test` generan `src/environments/environment.ts` a partir del `.env` (script `scripts/generar-environment.js`). Ese archivo y el `.env` están en `.gitignore`: no subirlos ni pegar la llave en issues o PRs.

Si el editor marca error en el import de `environments` antes de correr el proyecto por primera vez, generarlo a mano:

```bash
node scripts/generar-environment.js
```

La llave se pide al equipo o se crea en Google Cloud Console habilitando la _Maps JavaScript API_. Conviene restringirla a `http://localhost:4200/*`.

## Correr

```bash
npm start
```

Abrir http://localhost:4200.

| Ruta                                   | Pantalla                                    |
| -------------------------------------- | ------------------------------------------- |
| `/`                                    | Landing page                                |
| `/iniciar-sesion`                      | Iniciar sesión                              |
| `/onboarding-finca`                    | Registro de la primera finca del cafetalero |
| `/mapa-prueba`                         | Mapa de prueba de Google Maps               |
| `/registro`, `/explorar`, `/dashboard` | Pantallas pendientes (placeholder)          |
| `/cafetalero/fincas`                   | Mis fincas del cafetalero                   |
| `/cafetalero/fincas/:id`               | Detalle de una finca del cafetalero         |

Por ahora las pantallas usan datos de ejemplo de `src/app/core/mocks/finca.mock.ts`, así que no hace falta tener el backend corriendo. Cuando se conecten las vistas, levantar el backend siguiendo su README; queda en http://localhost:8080 y ya acepta peticiones desde `localhost:4200`.

## Probar

```bash
npm test               # tests en modo watch, abre Chrome
npm run test:ci        # una sola corrida en Chrome headless, como el CI
npm run lint
npm run format:check   # npm run format para corregir
npm run build
```

Los cuatro checks del CI (`Lint`, `Format`, `Test`, `Build`) corren con estos mismos comandos, así que conviene correrlos antes de abrir el PR.

## Flujo de trabajo

1. Crear un branch desde `develop` con el código del ticket de Jira (por ejemplo `feature/CP3-9-readme`).
2. Abrir el PR hacia `develop` usando la plantilla. Los cuatro checks tienen que pasar y otro integrante tiene que aprobarlo.
3. Al cerrar el sprint, `develop` pasa a `main` con el workflow _Promote to Main_ en GitHub Actions.

No hacer commits directos a `develop` ni a `main`.

## Problemas comunes

- **`npm ci` falla o avisa `EBADENGINE`**: la versión de Node no es 20.11.1. Revisar con `node -v`.
- **El mapa sale gris, con marca de agua o con `ApiNotActivatedMapError` / `InvalidKeyMapError`**: falta la llave en `.env`, está mal copiada o no tiene habilitada la Maps JavaScript API. Después de cambiar el `.env`, detener y volver a correr `npm start`.
- **`npm test` no encuentra Chrome**: instalar Chrome o definir `CHROME_BIN` con la ruta del ejecutable.
- **Puerto 4200 ocupado**: cerrar el otro `ng serve` o usar `npm start -- --port 4300` (el backend solo acepta CORS desde 4200).
