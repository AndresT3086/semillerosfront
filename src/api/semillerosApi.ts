import type {
  CaptchaResponse,
  FiltroItem,
  FilterValues,
  GuardarGeneralPayload,
  InscripcionFormData,
  LoginResponse,
  PageResponse,
  SemilleroCoordinador,
  SemilleroDetalle,
  SemilleroResumen,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// El backend envuelve todas las respuestas en ApiResponse<T> { exitoso, mensaje, datos, ... }
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje ?? `Error ${res.status}`);
  }
  const json = await res.json();
  return json.datos ?? json;
}

export async function getSemilleros(
  filters: FilterValues,
  pagina = 0,
  tamano = 15
): Promise<PageResponse<SemilleroResumen>> {
  const params = new URLSearchParams({
    pagina: String(pagina),
    tamano: String(tamano),
  });
  if (filters.idUnidad) params.set('idUnidad', filters.idUnidad);
  if (filters.idCampus) params.set('idCampus', filters.idCampus);
  if (filters.idArea) params.set('idArea', filters.idArea);
  if (filters.q) params.set('q', filters.q);
  return apiFetch<PageResponse<SemilleroResumen>>(`/api/v1/semilleros?${params}`);
}

export async function getSemilleroById(id: number): Promise<SemilleroDetalle> {
  return apiFetch<SemilleroDetalle>(`/api/v1/semilleros/${id}`);
}

export async function submitInscripcion(
  idSemillero: number,
  formData: InscripcionFormData
): Promise<void> {
  await apiFetch('/api/v1/inscripciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idSemillero, ...formData }),
  });
}

export async function getUnidades(): Promise<FiltroItem[]> {
  return apiFetch<FiltroItem[]>('/api/v1/filtros/unidades-academicas');
}

export async function getCampus(): Promise<FiltroItem[]> {
  return apiFetch<FiltroItem[]>('/api/v1/filtros/campus');
}

export async function getAreasOcde(): Promise<FiltroItem[]> {
  return apiFetch<FiltroItem[]>('/api/v1/filtros/areas-ocde');
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function getCaptcha(): Promise<CaptchaResponse> {
  return apiFetch<CaptchaResponse>('/api/v1/auth/captcha-math');
}

export async function loginCoordinador(
  correo: string,
  password: string,
  respuestaMath: number,
  operando1: number,
  operando2: number,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password, respuestaMath, operando1, operando2 }),
  });
}

// ── Coordinador: gestión de semilleros ────────────────────────────────────────
function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function iniciarCaracterizacion(token: string): Promise<SemilleroCoordinador> {
  return apiFetch<SemilleroCoordinador>('/api/v1/coordinador/semilleros/iniciar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
  });
}

export async function getMisSemilleros(token: string): Promise<SemilleroCoordinador[]> {
  return apiFetch<SemilleroCoordinador[]>('/api/v1/coordinador/semilleros/mis-semilleros', {
    headers: authHeaders(token),
  });
}

export async function getMiSemillero(token: string): Promise<SemilleroCoordinador> {
  return apiFetch<SemilleroCoordinador[]>('/api/v1/coordinador/semilleros/mis-semilleros', {
    headers: authHeaders(token),
  }).then((semilleros) => {
    if (semilleros.length === 0) throw new Error('No tienes semilleros registrados.');
    return semilleros[0];
  });
}

export async function getSemilleroCoordinadorById(
  idSemillero: number,
  token: string,
): Promise<SemilleroCoordinador> {
  return apiFetch<SemilleroCoordinador>(`/api/v1/coordinador/semilleros/${idSemillero}`, {
    headers: authHeaders(token),
  });
}

export async function guardarPestanaGeneral(
  idSemillero: number,
  payload: GuardarGeneralPayload,
  token: string,
): Promise<SemilleroCoordinador> {
  return apiFetch<SemilleroCoordinador>(
    `/api/v1/coordinador/semilleros/${idSemillero}/pestana/general`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    },
  );
}

export async function finalizarCaracterizacion(
  idSemillero: number,
  token: string,
): Promise<SemilleroCoordinador> {
  return apiFetch<SemilleroCoordinador>(
    `/api/v1/coordinador/semilleros/${idSemillero}/finalizar`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
}
