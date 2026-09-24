export const REPORT_FILTERS_KEY = 'sigsi_report_filters';
export const EMPTY_FILTERS = { periodo: '', tipoUnidad: '', idUnidad: '', idSemillero: '', idCampus: '' };
export type ReportFilters = typeof EMPTY_FILTERS;
export function readReportFilters(): ReportFilters {
  try {
    const value = JSON.parse(sessionStorage.getItem(REPORT_FILTERS_KEY) ?? '{}');
    const result = { ...EMPTY_FILTERS };
    for (const key of Object.keys(result) as (keyof ReportFilters)[]) {
      if (typeof value?.[key] === 'string') result[key] = value[key];
    }
    if (!/^\d{4}(-[12])?$/.test(result.periodo)) result.periodo = '';
    if (!['', 'FACULTAD', 'ESCUELA', 'INSTITUTO', 'CORPORACION'].includes(result.tipoUnidad)) result.tipoUnidad = '';
    if (!/^\d+$/.test(result.idUnidad)) result.idUnidad = '';
    if (!/^\d+$/.test(result.idSemillero)) result.idSemillero = '';
    if (!/^\d+$/.test(result.idCampus)) result.idCampus = '';
    return result;
  } catch { return { ...EMPTY_FILTERS }; }
}
