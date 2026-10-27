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

fs.writeFileSync(path.join(raiz, 'src/environments/environment.ts'), contenido);
