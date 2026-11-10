const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const archivoEnv = path.join(raiz, '.env');

const variables = {
  GOOGLE_MAPS_API_KEY: '',
  GOOGLE_CLIENT_ID: '',
  API_URL: 'http://localhost:8080',
};

if (fs.existsSync(archivoEnv)) {
  for (const linea of fs.readFileSync(archivoEnv, 'utf8').split(/\r?\n/)) {
    const [clave, ...valor] = linea.split('=');
    const nombre = clave.trim();
    if (nombre in variables) {
      variables[nombre] = valor.join('=').trim();
    }
  }
}

if (!variables.API_URL) {
  variables.API_URL = 'http://localhost:8080';
}

const contenido = `export const environment = {
  googleMapsApiKey: ${JSON.stringify(variables.GOOGLE_MAPS_API_KEY)},
  googleClientId: ${JSON.stringify(variables.GOOGLE_CLIENT_ID)},
  apiUrl: ${JSON.stringify(variables.API_URL)},
};
`;

const carpeta = path.join(raiz, 'src/environments');
fs.mkdirSync(carpeta, { recursive: true });
fs.writeFileSync(path.join(carpeta, 'environment.ts'), contenido);
