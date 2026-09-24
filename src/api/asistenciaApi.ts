import { apiFetch, authHeaders } from './semillerosApi';

// Registro de actividades y asistencia: solo el coordinador del semillero.
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';

/** % = presentes / (presentes + ausentes); las excusas se descuentan. Sin «porcentaje» = no hay asistencias esperadas. */
export interface ConteoAsistencia { presentes: number; ausentes: number; excusados: number; porcentaje?: number }

export interface Sesion {
  id: number;
  idSemillero: number;
  idActividad?: number;
  actividad?: string;
  titulo: string;
  fecha: string;
  asistencia: ConteoAsistencia;
}

export interface Asistente { idIntegrante: number; nombre: string; cedula: string; estado: EstadoAsistencia }
export interface SesionDetalle { sesion: Sesion; asistencias: Asistente[] }
export interface IntegranteAsistencia { idIntegrante: number; nombre: string; cedula: string; activo: boolean; asistencia: ConteoAsistencia }

export interface DatosSesion {
  titulo: string;
  fecha: string;
  idActividad: number | null;
  asistencias: { idIntegrante: number; estado: EstadoAsistencia }[];
}

const BASE = '/api/v1/coordinador/semilleros';

function query(periodo: string) {
  return periodo ? `?${new URLSearchParams({ periodo })}` : '';
}

export function getSesiones(idSemillero: number, periodo: string, token: string): Promise<Sesion[]> {
  return apiFetch<Sesion[]>(`${BASE}/${idSemillero}/sesiones${query(periodo)}`, { headers: authHeaders(token), cache: 'no-store' });
}

export function getSesion(idSesion: number, token: string): Promise<SesionDetalle> {
  return apiFetch<SesionDetalle>(`${BASE}/sesiones/${idSesion}`, { headers: authHeaders(token), cache: 'no-store' });
}

export function getAsistenciaIntegrantes(idSemillero: number, periodo: string, token: string): Promise<IntegranteAsistencia[]> {
  return apiFetch<IntegranteAsistencia[]>(`${BASE}/${idSemillero}/asistencia/integrantes${query(periodo)}`,
    { headers: authHeaders(token), cache: 'no-store' });
}

export function registrarSesion(idSemillero: number, datos: DatosSesion, token: string): Promise<SesionDetalle> {
  return apiFetch<SesionDetalle>(`${BASE}/${idSemillero}/sesiones`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(datos),
  });
}

export function actualizarSesion(idSesion: number, datos: DatosSesion, token: string): Promise<SesionDetalle> {
  return apiFetch<SesionDetalle>(`${BASE}/sesiones/${idSesion}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(datos),
  });
}

export async function eliminarSesion(idSesion: number, token: string): Promise<void> {
  await apiFetch(`${BASE}/sesiones/${idSesion}`, { method: 'DELETE', headers: authHeaders(token) });
}

/** Mismo cálculo que el backend, para totales mostrados en pantalla. */
export function sumarAsistencia(conteos: ConteoAsistencia[]): ConteoAsistencia {
  const total = conteos.reduce((acc, c) => ({
    presentes: acc.presentes + c.presentes, ausentes: acc.ausentes + c.ausentes, excusados: acc.excusados + c.excusados,
  }), { presentes: 0, ausentes: 0, excusados: 0 });
  const esperadas = total.presentes + total.ausentes;
  return esperadas ? { ...total, porcentaje: Math.round(total.presentes * 1000 / esperadas) / 10 } : total;
}
