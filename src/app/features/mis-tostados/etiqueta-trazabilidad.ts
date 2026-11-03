import { LoteComprado } from '../../core/models/tueste.model';

function escapar(texto: string): string {
  return texto.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

// Etiqueta que se descarga desde la ficha del código. SVG para que se imprima nítida a
// cualquier tamaño en las bolsas.
export function etiquetaSvg(lote: LoteComprado, tostador: string): string {
  const lineas = [
    `Finca ${lote.finca} · ${lote.variedad}, ${lote.proceso}`,
    `Lote ${lote.codigoLote} · ${lote.kg} kg`,
    `Tostado por ${tostador}`,
  ].map(escapar);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
  <rect width="600" height="320" rx="24" fill="#fbf7ef"/>
  <rect x="12" y="12" width="576" height="296" rx="16" fill="none" stroke="#c9a227" stroke-width="2"/>
  <text x="44" y="70" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" letter-spacing="2" fill="#946c00">CÓDIGO DE TRAZABILIDAD · CRÁNHUA</text>
  <text x="44" y="140" font-family="Consolas, 'Courier New', monospace" font-size="56" font-weight="700" fill="#1c3426">${escapar(lote.codigoTrazabilidad ?? '')}</text>
  ${lineas
    .map(
      (linea, i) =>
        `<text x="44" y="${200 + i * 32}" font-family="Inter, Arial, sans-serif" font-size="20" fill="#4f5d56">${linea}</text>`,
    )
    .join('\n  ')}
</svg>
`;
}
