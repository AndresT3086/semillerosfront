import { afterEach, expect, it, vi } from 'vitest';
import { getCatalogoReportes, getReportesDisponibles, getReporteSemillero } from './semillerosApi';
const page = (contenido: unknown[], paginaActual = 0, totalPaginas = 1) => ({ contenido, paginaActual, totalPaginas, totalElementos: 2, tamano: 10, esPrimeraPagina: paginaActual === 0, esUltimaPagina: paginaActual === totalPaginas - 1 });
function response(datos: unknown) { return { ok: true, json: async () => ({ datos }) }; }
afterEach(() => vi.unstubAllGlobals());
it('envía idUnidad como query param y omite el filtro para todas las unidades', async () => {
  const fetchMock = vi.fn().mockResolvedValue(response(page([])));
  vi.stubGlobal('fetch', fetchMock);
  await getReportesDisponibles('12', 2);
  let url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.searchParams.get('idUnidad')).toBe('12');
  expect(url.searchParams.get('pagina')).toBe('2');
  expect(fetchMock.mock.calls[0][1].cache).toBe('no-store');
  await getReportesDisponibles();
  url = new URL(fetchMock.mock.calls[1][0]);
  expect(url.searchParams.has('idUnidad')).toBe(false);
});
it('carga todas las páginas del catálogo para no omitir semilleros del selector', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(response(page([{ id: 1 }], 0, 2)))
    .mockResolvedValueOnce(response(page([{ id: 2 }], 1, 2)));
  vi.stubGlobal('fetch', fetchMock);
  expect(await getCatalogoReportes('3')).toEqual([{ id: 1 }, { id: 2 }]);
  expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('pagina')).toBe('1');
  expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('idUnidad')).toBe('3');
});
it('consulta solo el detalle seleccionado y no cuenta un semillero inactivo como activo', async () => {
  const fetchMock = vi.fn().mockResolvedValue(response({ id: 4, estado: 'INACTIVO' }));
  vi.stubGlobal('fetch', fetchMock);
  const result = await getReporteSemillero('4');
  expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/api/v1/semilleros/4');
  expect(result.contenido).toEqual([]);
  expect(result.totalElementos).toBe(0);
});
