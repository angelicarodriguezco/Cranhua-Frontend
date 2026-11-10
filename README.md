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

Copiar `.env.example` a `.env` y completar los valores. No pegar secretos en el README, issues o PRs.

| Variable              | Obligatoria | Para qué sirve                                                                                  |
| --------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `GOOGLE_MAPS_API_KEY` | Sí\*        | Llave de la Maps JavaScript API. Sin ella la app corre, pero los mapas no cargan.               |
| `GOOGLE_CLIENT_ID`    | Sí\*        | Client ID de Google Identity Services (inicio de sesión / registro con Google).                 |
| `API_URL`             | No          | URL base del backend. Si se omite, el script usa el valor por defecto local del `.env.example`. |

\*La app arranca sin ellas, pero mapas y login/registro con Google no funcionan.

Ejemplo de forma (sin valores reales):

```bash
GOOGLE_MAPS_API_KEY=
GOOGLE_CLIENT_ID=
API_URL=
```

`npm start`, `npm run build` y `npm test` generan `src/environments/environment.ts` a partir del `.env` (script `scripts/generar-environment.js`). Ese archivo y el `.env` están en `.gitignore`.

Si el editor marca error en el import de `environments` antes de correr el proyecto por primera vez, generarlo a mano:

```bash
node scripts/generar-environment.js
```

## Dependencias externas

Servicios y proyectos fuera de este repo que el frontend usa. No hace falta pegar valores reales aquí: pedilos al equipo o créalos con los pasos de abajo y guardalos solo en tu `.env`.

### Google Maps JavaScript API

|                    |                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Para qué**       | Mapas en perfiles, registro de finca/cafetería y vistas de explorar.                                                                                                                                                                                                                                                            |
| **Qué necesitás**  | Una API key con la _Maps JavaScript API_ habilitada → variable `GOOGLE_MAPS_API_KEY`.                                                                                                                                                                                                                                           |
| **Cómo obtenerla** | 1. Entrá a [Google Cloud Console](https://console.cloud.google.com/). 2. Creá o elegí un proyecto. 3. Activá **Maps JavaScript API**. 4. En _APIs y servicios → Credenciales_, creá una **clave de API**. 5. Restringila a HTTP referrers (`http://localhost:4200/*` en local). 6. Pegala en `.env` como `GOOGLE_MAPS_API_KEY`. |

Sin esta llave la app corre, pero los mapas no cargan.

### Google Identity Services (OAuth)

|                    |                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Para qué**       | Botones de iniciar sesión y registrarse con Google.                                                                                                                                                                                                                                                                                                                                                                                            |
| **Qué necesitás**  | Un **Client ID** de tipo aplicación web → variable `GOOGLE_CLIENT_ID`.                                                                                                                                                                                                                                                                                                                                                                         |
| **Cómo obtenerlo** | 1. En [Google Cloud Console](https://console.cloud.google.com/), mismo proyecto o uno del equipo. 2. Activá la pantalla de consentimiento OAuth si pide. 3. En _APIs y servicios → Credenciales_, creá un **ID de cliente OAuth** de tipo **Aplicación web**. 4. En orígenes autorizados de JavaScript agregá `http://localhost:4200`. 5. Pegá el Client ID en `.env` como `GOOGLE_CLIENT_ID` (no hace falta el Client Secret en el frontend). |

Sin este Client ID, el login/registro con correo sigue disponible; el flujo con Google no.

### Cranhua Backend

|                    |                                                                                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Para qué**       | Auth, cuenta, fincas, cafeterías y el resto de la API.                                                                                                                                                                                                                                          |
| **Qué necesitás**  | El repo backend corriendo en local (o la URL del entorno) → variable `API_URL`.                                                                                                                                                                                                                 |
| **Cómo obtenerlo** | 1. Cloná [Cranhua-Backend](https://github.com/angelicarodriguezco/Cranhua-Backend). 2. Seguí su README para instalar y levantar el servidor. 3. Por defecto queda en `http://localhost:8080` y acepta CORS desde `http://localhost:4200`. 4. Si usás otra URL, ponela en `.env` como `API_URL`. |

Varias pantallas todavía usan mocks en `src/app/core/mocks/`; para esas no hace falta el backend. Las que ya llaman a la API sí lo necesitan.

## Correr

```bash
npm start
```

Abrir http://localhost:4200.

| Ruta                            | Pantalla                                           |
| ------------------------------- | -------------------------------------------------- |
| `/`                             | Landing page                                       |
| `/iniciar-sesion`               | Iniciar sesión                                     |
| `/registro`                     | Crear cuenta                                       |
| `/onboarding-finca`             | Registro de la primera finca del cafetalero        |
| `/dashboard`                    | Dashboard del cafetalero                           |
| `/cafetalero/fincas`            | Mis fincas del cafetalero                          |
| `/cafetalero/fincas/:id`        | Detalle de una finca del cafetalero                |
| `/mis-fincas/registrar`         | Registrar otra finca desde el panel del cafetalero |
| `/registrar-cosecha`            | Registrar cosecha                                  |
| `/cosechas/:id/editar`          | Editar cosecha                                     |
| `/historial`                    | Historial de cosechas y lotes vendidos             |
| `/tostador/cosechas`            | Explorar cosechas (tostador)                       |
| `/tostador/tostados`            | Mis tostados (tostador)                            |
| `/tostador/tostados/nuevo`      | Crear tueste (tostador)                            |
| `/tostador/tostados/:id/editar` | Editar tueste (tostador)                           |
| `/mapa-prueba`                  | Mapa de prueba de Google Maps                      |
| `/explorar`, `/perfil`          | Pantallas pendientes (placeholder)                 |

El dashboard y `/mis-fincas/registrar` comparten el tema: se cambia con el botón _Tema claro / Tema oscuro_ del menú lateral.

Para pantallas que aún usan mocks no hace falta el backend. Para auth y APIs conectadas, levantalo como se indica en **Dependencias externas**.

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
- **El mapa sale gris, con marca de agua o con `ApiNotActivatedMapError` / `InvalidKeyMapError`**: falta `GOOGLE_MAPS_API_KEY` en `.env`, está mal copiada o no tiene habilitada la Maps JavaScript API. Después de cambiar el `.env`, detener y volver a correr `npm start`.
- **Login/registro con Google no abre o falla el Client ID**: falta `GOOGLE_CLIENT_ID` o el origen `http://localhost:4200` no está autorizado en la consola de Google.
- **`npm test` no encuentra Chrome**: instalar Chrome o definir `CHROME_BIN` con la ruta del ejecutable.
- **Puerto 4200 ocupado**: cerrar el otro `ng serve` o usar `npm start -- --port 4300` (el backend solo acepta CORS desde 4200).
