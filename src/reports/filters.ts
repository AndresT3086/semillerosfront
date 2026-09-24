export const REPORT_FILTERS_KEY = 'sigsi_report_filters';
export const EMPTY_FILTERS = { periodo: '', tipoUnidad: '', idUnidad: '', idSemillero: '', idCampus: '' };
export type ReportFilters = typeof EMPTY_FILTERS;
export const TIPOS_UNIDAD = ['FACULTAD', 'ESCUELA', 'INSTITUTO', 'CORPORACION', 'SECCIONAL'];
const KEYS = Object.keys(EMPTY_FILTERS) as (keyof ReportFilters)[];

function sanitize(value: Partial<Record<keyof ReportFilters, unknown>>): ReportFilters {
  const result = { ...EMPTY_FILTERS };
  for (const key of KEYS) {
    if (typeof value?.[key] === 'string') result[key] = value[key] as string;
  }
  if (!/^\d{4}(-[12])?$/.test(result.periodo)) result.periodo = '';
  if (!['', ...TIPOS_UNIDAD].includes(result.tipoUnidad)) result.tipoUnidad = '';
  if (!/^\d+$/.test(result.idUnidad)) result.idUnidad = '';
  if (!/^\d+$/.test(result.idSemillero)) result.idSemillero = '';
  if (!/^\d+$/.test(result.idCampus)) result.idCampus = '';
  return result;
}

function replaceQuery(params: URLSearchParams) {
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

// RN51: la URL tiene prioridad (enlace compartido o recarga); si no trae filtros,
// se recuperan los de la sesión (RN6).
export function readReportFilters(): ReportFilters {
  const params = new URLSearchParams(window.location.search);
  if (KEYS.some(key => params.has(key))) {
    return sanitize(Object.fromEntries(KEYS.map(key => [key, params.get(key) ?? ''])));
  }
  try {
    return sanitize(JSON.parse(sessionStorage.getItem(REPORT_FILTERS_KEY) ?? '{}'));
  } catch { return { ...EMPTY_FILTERS }; }
}

export function writeReportFilters(filters: ReportFilters) {
  try { sessionStorage.setItem(REPORT_FILTERS_KEY, JSON.stringify(filters)); } catch { /* Storage no disponible: la página sigue funcionando. */ }
  const params = new URLSearchParams(window.location.search);
  for (const key of KEYS) {
    if (filters[key]) params.set(key, filters[key]); else params.delete(key);
  }
  replaceQuery(params);
}

// Al salir de reportes o cerrar sesión los filtros no deben quedar en la URL ni en la sesión.
export function clearReportFilters() {
  try { sessionStorage.removeItem(REPORT_FILTERS_KEY); } catch { /* Storage no disponible. */ }
  const params = new URLSearchParams(window.location.search);
  KEYS.forEach(key => params.delete(key));
  replaceQuery(params);
}
