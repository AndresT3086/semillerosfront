import type { PageResponse } from '../types';
import type { ReportFilters } from '../reports/filters';
import { apiFetch, authHeaders, BASE_URL } from './semillerosApi';
import type { ConteoAsistencia } from './asistenciaApi';

// Alcance de los reportes según el rol (HU12). El backend valida el rol con el JWT.
export type AlcanceReporte = 'ADMIN' | 'COORDINADOR' | 'PUBLICO';
export type TipoUnidad = 'FACULTAD' | 'ESCUELA' | 'INSTITUTO' | 'CORPORACION' | 'SECCIONAL' | 'OTRA';

const RUTAS: Record<AlcanceReporte, string> = {
  ADMIN: '/api/v1/admin/reportes',
  COORDINADOR: '/api/v1/coordinador/reportes',
  PUBLICO: '/api/v1/reportes/publico',
};

// El backend omite los campos null: una propiedad ausente significa «no disponible».
export interface ReporteKpis {
  semillerosActivos: number;
  usuariosRegistrados: number;
  miembrosActivos: number;
  actividadesRealizadas: number;
  tasaParticipacion?: number;
  tendencias: {
    semillerosActivos?: number;
    usuariosRegistrados?: number;
    miembrosActivos?: number;
    /** Diferencia en puntos porcentuales. */
    tasaParticipacion?: number;
  };
  periodoComparado: string;
  fechaCalculo: string;
  alcance: AlcanceReporte;
}

export interface ReporteConteo { id: string; nombre: string; cantidad: number }
export interface ReporteUnidad { id: number; nombre: string; tipo: TipoUnidad; semilleros: number; estudiantes: number }
export interface ReporteEvolucion { anio: number; semillerosActivos: number; nuevos: number; proyectado: boolean }

export interface ReporteDashboard {
  kpis: ReporteKpis;
  porUnidad: ReporteUnidad[];
  porCampus: ReporteConteo[];
  topFacultades: ReporteUnidad[];
  porSexo: ReporteConteo[];
  porRol: ReporteConteo[];
  evolucion: ReporteEvolucion[];
  actividadesPorTipo: ReporteConteo[];
  /** Asistencia agregada: suma de asistencias esperadas de todos los semilleros filtrados. */
  asistencia: { sesiones: number; asistencia: ConteoAsistencia };
}

export interface ReporteRendimiento {
  id: number;
  nombre?: string;
  codigo: string;
  unidadAcademica?: string;
  tipoUnidad: TipoUnidad;
  campus?: string;
  participantes: number;
  actividadesRealizadas: number;
  /** Actividades registradas con asistencia en el período. */
  sesiones: number;
  /** Presentes / (presentes + ausentes); ausente si no hay registros de asistencia. */
  porcentajeAsistencia?: number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ReporteOpcion { id: number; nombre: string }

export type OrdenRendimiento = 'nombre' | 'unidad' | 'tipo' | 'campus' | 'participantes' | 'actividades' | 'sesiones' | 'asistencia' | 'estado';
export interface OrdenTabla { orden: OrdenRendimiento; direccion: 'asc' | 'desc' }
export type FormatoExportacion = 'xlsx' | 'pdf' | 'csv';

// RN5: los filtros viajan como query params; los vacíos se omiten.
export function filtrosAQuery(filters: Partial<ReportFilters>, extra: Record<string, string | number> = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return params;
}

function opciones(token: string | undefined, signal?: AbortSignal): RequestInit {
  return { headers: token ? authHeaders(token) : undefined, cache: 'no-store', signal };
}

export function getDashboard(alcance: AlcanceReporte, filters: ReportFilters, token?: string, signal?: AbortSignal): Promise<ReporteDashboard> {
  // El alcance público no admite un semillero específico (RN44)
  const query = filtrosAQuery(alcance === 'PUBLICO' ? { ...filters, idSemillero: '' } : filters);
  return apiFetch<ReporteDashboard>(`${RUTAS[alcance]}/dashboard?${query}`, opciones(token, signal));
}

export function getRendimiento(alcance: Exclude<AlcanceReporte, 'PUBLICO'>, filters: ReportFilters, pagina: number,
  orden: OrdenTabla, token: string, signal?: AbortSignal, tamano = 10): Promise<PageResponse<ReporteRendimiento>> {
  const query = filtrosAQuery(filters, { pagina, tamano, orden: orden.orden, direccion: orden.direccion });
  return apiFetch<PageResponse<ReporteRendimiento>>(`${RUTAS[alcance]}/rendimiento?${query}`, opciones(token, signal));
}

// RN49: solo semilleros activos que cumplen los demás filtros.
export function getSemillerosReporte(alcance: Exclude<AlcanceReporte, 'PUBLICO'>, filters: ReportFilters, token: string,
  signal?: AbortSignal): Promise<ReporteOpcion[]> {
  const query = filtrosAQuery({ ...filters, idSemillero: '' });
  return apiFetch<ReporteOpcion[]>(`${RUTAS[alcance]}/semilleros?${query}`, opciones(token, signal));
}

// HU10: el backend genera el archivo con los filtros aplicados (RN35) y lo nombra con fecha y hora (RN36).
export async function exportarReporte(formato: FormatoExportacion, filters: ReportFilters, orden: OrdenTabla,
  token: string): Promise<{ nombre: string; archivo: Blob }> {
  const query = filtrosAQuery(filters, { formato, orden: orden.orden, direccion: orden.direccion });
  const res = await fetch(`${BASE_URL}${RUTAS.ADMIN}/exportar?${query}`, opciones(token));
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje ?? `Error ${res.status}`);
  }
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const nombre = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `reporte_sigsi.${formato}`;
  return { nombre, archivo: await res.blob() };
}

export function descargarArchivo(nombre: string, archivo: Blob) {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export interface EventoReporte { evento: string; datos: string }

// Separa un flujo text/event-stream en eventos. Devuelve el texto sobrante incompleto.
export function parsearEventos(buffer: string): { eventos: EventoReporte[]; resto: string } {
  const bloques = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const resto = bloques.pop() ?? '';
  const eventos: EventoReporte[] = [];
  for (const bloque of bloques) {
    let evento = 'message';
    const datos: string[] = [];
    for (const linea of bloque.split('\n')) {
      if (linea.startsWith('event:')) evento = linea.slice(6).trim();
      else if (linea.startsWith('data:')) datos.push(linea.slice(5).trim());
    }
    if (datos.length || evento !== 'message') eventos.push({ evento, datos: datos.join('\n') });
  }
  return { eventos, resto };
}

// HU13: Server-Sent Events con fetch, porque EventSource no permite enviar el token JWT.
// Se resuelve cuando el servidor cierra la conexión y rechaza si falla.
export async function escucharEventosReportes(token: string, onEvento: (evento: EventoReporte) => void,
  signal: AbortSignal): Promise<void> {
  const res = await fetch(`${BASE_URL}${RUTAS.ADMIN}/eventos`, {
    headers: { ...authHeaders(token), Accept: 'text/event-stream' }, cache: 'no-store', signal,
  });
  if (!res.ok || !res.body) throw new Error(`Error ${res.status}`);
  const lector = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await lector.read();
    if (done) return;
    const { eventos, resto } = parsearEventos(buffer + value);
    buffer = resto;
    eventos.forEach(onEvento);
  }
}
