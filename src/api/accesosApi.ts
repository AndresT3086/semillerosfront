import { apiFetch, authHeaders, BASE_URL } from './semillerosApi';

// Registro de coordinadores: solicitud pública, confirmación de correo, activación de cuenta
// y administración de solicitudes e invitaciones (solo ADMIN).

export interface DatosSolicitudAcceso {
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  idUnidadAcademica: number | null;
  justificacion: string;
  /** Campo trampa: el formulario lo oculta y debe ir vacío. */
  sitioWeb: string;
  respuestaMath: number;
  operando1: number;
  operando2: number;
}

export type EstadoSolicitud = 'PENDIENTE_VERIFICACION' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudAcceso {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  unidadAcademica?: string;
  justificacion: string;
  estado: EstadoSolicitud;
  fechaCreacion: string;
  fechaVerificacion?: string;
  fechaRevision?: string;
  motivoRechazo?: string;
  bloqueada: boolean;
}

/** Resultado de aprobar o invitar: la cuenta queda registrada aunque el correo no haya salido. */
export interface ResultadoEnvio { mensaje: string; correoEnviado: boolean }

async function respuesta(path: string, options: RequestInit): Promise<{ mensaje?: string; datos?: { correoEnviado?: boolean } }> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const validaciones = body.datos && typeof body.datos === 'object'
      ? Object.values(body.datos).filter((v): v is string => typeof v === 'string') : [];
    throw new Error(validaciones.length ? validaciones.join(' ') : body.mensaje ?? `Error ${res.status}`);
  }
  return body;
}

async function mensaje(path: string, options: RequestInit): Promise<string> {
  return (await respuesta(path, options)).mensaje ?? '';
}

async function resultadoEnvio(path: string, options: RequestInit): Promise<ResultadoEnvio> {
  const body = await respuesta(path, options);
  return { mensaje: body.mensaje ?? '', correoEnviado: body.datos?.correoEnviado !== false };
}

function post(body: unknown, token?: string): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? authHeaders(token) : {}) }, body: JSON.stringify(body) };
}

/** Siempre responde el mismo mensaje si el formulario es válido, para no revelar qué correos existen. */
export function solicitarAcceso(datos: DatosSolicitudAcceso): Promise<string> {
  return mensaje('/api/v1/solicitudes-acceso', post(datos));
}

export function verificarCorreo(token: string): Promise<string> {
  return mensaje('/api/v1/solicitudes-acceso/verificar', post({ token }));
}

export function activarCuenta(token: string, contrasena: string): Promise<string> {
  return mensaje('/api/v1/cuenta/activar', post({ token, contrasena }));
}

export function getSolicitudesAcceso(token: string, estado: EstadoSolicitud = 'PENDIENTE'): Promise<SolicitudAcceso[]> {
  return apiFetch<SolicitudAcceso[]>(`/api/v1/admin/solicitudes-acceso?${new URLSearchParams({ estado })}`,
    { headers: authHeaders(token), cache: 'no-store' });
}

export async function contarSolicitudesPendientes(token: string): Promise<number> {
  const resumen = await apiFetch<{ pendientes: number }>('/api/v1/admin/solicitudes-acceso/resumen',
    { headers: authHeaders(token), cache: 'no-store' });
  return resumen.pendientes;
}

export function aprobarSolicitud(id: number, token: string): Promise<ResultadoEnvio> {
  return resultadoEnvio(`/api/v1/admin/solicitudes-acceso/${id}/aprobar`, post({}, token));
}

export function rechazarSolicitud(id: number, motivo: string, bloquear: boolean, token: string): Promise<string> {
  return mensaje(`/api/v1/admin/solicitudes-acceso/${id}/rechazar`, post({ motivo, bloquear }, token));
}

export function invitarCoordinador(datos: { nombres: string; apellidos: string; correo: string }, token: string): Promise<ResultadoEnvio> {
  return resultadoEnvio('/api/v1/admin/invitaciones', post(datos, token));
}

export const DOMINIO_INSTITUCIONAL = '@udea.edu.co';

export function esCorreoInstitucional(correo: string): boolean {
  const limpio = correo.trim().toLowerCase();
  return limpio.endsWith(DOMINIO_INSTITUCIONAL) && limpio.length > DOMINIO_INSTITUCIONAL.length
    && /^[^\s@]+@udea\.edu\.co$/.test(limpio);
}

/** Misma regla que el backend: 10 a 72 caracteres, con al menos una letra y un número. */
export function contrasenaValida(contrasena: string): boolean {
  return contrasena.length >= 10 && contrasena.length <= 72 && /\p{L}/u.test(contrasena) && /\d/.test(contrasena);
}
