import { CantonReferencia } from '../models/cafeteria.model';

// Cantones del GAM para ubicar cafeterías: CANTONES solo trae los cafetaleros.
// Coordenadas aproximadas de la cabecera de cada cantón
export const CANTONES_URBANOS: CantonReferencia[] = [
  { nombre: 'San José', provincia: 'San José', cabecera: { lat: 9.9326, lng: -84.0796 } },
  { nombre: 'Escazú', provincia: 'San José', cabecera: { lat: 9.9189, lng: -84.1397 } },
  { nombre: 'Santa Ana', provincia: 'San José', cabecera: { lat: 9.9325, lng: -84.1825 } },
  { nombre: 'Desamparados', provincia: 'San José', cabecera: { lat: 9.8977, lng: -84.0631 } },
  { nombre: 'Alajuelita', provincia: 'San José', cabecera: { lat: 9.9022, lng: -84.1003 } },
  { nombre: 'Goicoechea', provincia: 'San José', cabecera: { lat: 9.9478, lng: -84.0544 } },
  { nombre: 'Montes de Oca', provincia: 'San José', cabecera: { lat: 9.9347, lng: -84.0508 } },
  { nombre: 'Curridabat', provincia: 'San José', cabecera: { lat: 9.9161, lng: -84.0353 } },
  { nombre: 'Moravia', provincia: 'San José', cabecera: { lat: 9.9614, lng: -84.0486 } },
  { nombre: 'Tibás', provincia: 'San José', cabecera: { lat: 9.9578, lng: -84.0819 } },
  { nombre: 'Heredia', provincia: 'Heredia', cabecera: { lat: 9.9986, lng: -84.1169 } },
  { nombre: 'Santo Domingo', provincia: 'Heredia', cabecera: { lat: 9.9817, lng: -84.0897 } },
  { nombre: 'Belén', provincia: 'Heredia', cabecera: { lat: 9.9789, lng: -84.1847 } },
  { nombre: 'Cartago', provincia: 'Cartago', cabecera: { lat: 9.8644, lng: -83.9194 } },
];
