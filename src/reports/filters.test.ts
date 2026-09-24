import { afterEach, expect, it } from 'vitest';
import { clearReportFilters, EMPTY_FILTERS, readReportFilters, REPORT_FILTERS_KEY, writeReportFilters } from './filters';

afterEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

it('lee los filtros de la URL antes que los de la sesión y descarta valores inválidos (RN51)', () => {
  sessionStorage.setItem(REPORT_FILTERS_KEY, JSON.stringify({ idUnidad: '9' }));
  window.history.replaceState(null, '', '/?vista=reportes&periodo=2025-1&tipoUnidad=SECCIONAL&idSemillero=abc');
  expect(readReportFilters()).toEqual({ ...EMPTY_FILTERS, periodo: '2025-1', tipoUnidad: 'SECCIONAL' });
});

it('recupera los filtros de la sesión si la URL no los trae (RN6)', () => {
  sessionStorage.setItem(REPORT_FILTERS_KEY, JSON.stringify({ idUnidad: '9', periodo: '20251' }));
  expect(readReportFilters()).toEqual({ ...EMPTY_FILTERS, idUnidad: '9' });
  sessionStorage.setItem(REPORT_FILTERS_KEY, '{no-json');
  expect(readReportFilters()).toEqual(EMPTY_FILTERS);
});

it('escribe los filtros en la URL sin perder otros parámetros y los limpia al salir', () => {
  window.history.replaceState(null, '', '/?vista=reportes');
  writeReportFilters({ ...EMPTY_FILTERS, idSemillero: '4', periodo: '2026' });
  expect(window.location.search).toBe('?vista=reportes&periodo=2026&idSemillero=4');
  expect(JSON.parse(sessionStorage.getItem(REPORT_FILTERS_KEY)!).idSemillero).toBe('4');
  clearReportFilters();
  expect(window.location.search).toBe('?vista=reportes');
  expect(sessionStorage.getItem(REPORT_FILTERS_KEY)).toBeNull();
});
