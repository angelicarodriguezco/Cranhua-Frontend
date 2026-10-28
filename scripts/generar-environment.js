const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const archivoEnv = path.join(raiz, '.env');

let apiKey = '';
if (fs.existsSync(archivoEnv)) {
  for (const linea of fs.readFileSync(archivoEnv, 'utf8').split(/\r?\n/)) {
    const [clave, ...valor] = linea.split('=');
    if (clave.trim() === 'GOOGLE_MAPS_API_KEY') {
      apiKey = valor.join('=').trim();
    }
  }
}

const contenido = `export const environment = {
  googleMapsApiKey: ${JSON.stringify(apiKey)},
};
`;

// La carpeta no está en el repo porque solo tiene el archivo generado
const carpeta = path.join(raiz, 'src/environments');
fs.mkdirSync(carpeta, { recursive: true });
fs.writeFileSync(path.join(carpeta, 'environment.ts'), contenido);
