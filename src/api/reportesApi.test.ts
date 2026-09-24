import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FILTERS } from '../reports/filters';
import {
  escucharEventosReportes, exportarReporte, filtrosAQuery, getDashboard, getRendimiento, getSemillerosReporte, parsearEventos,
} from './reportesApi';

function response(datos: unknown) { return { ok: true, json: async () => ({ datos }) }; }
afterEach(() => vi.unstubAllGlobals());

describe('reportesApi', () => {
  it('envía solo los filtros con valor como query params (RN5)', () => {
    const params = filtrosAQuery({ ...EMPTY_FILTERS, periodo: '2025-1', idUnidad: '3' }, { pagina: 2 });
    expect(params.toString()).toBe('periodo=2025-1&idUnidad=3&pagina=2');
  });

  it('consulta el tablero según el alcance del rol y siempre con el token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ kpis: {} }));
    vi.stubGlobal('fetch', fetchMock);
    await getDashboard('ADMIN', { ...EMPTY_FILTERS, tipoUnidad: 'FACULTAD' }, 'tok');
    await getDashboard('COORDINADOR', { ...EMPTY_FILTERS, idSemillero: '4' }, 'tok2');
    const [admin, coordinador] = fetchMock.mock.calls.map(call => new URL(call[0]));
    expect(admin.pathname).toBe('/api/v1/admin/reportes/dashboard');
    expect(admin.searchParams.get('tipoUnidad')).toBe('FACULTAD');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer tok' });
    expect(coordinador.pathname).toBe('/api/v1/coordinador/reportes/dashboard');
    expect(coordinador.searchParams.get('idSemillero')).toBe('4');
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ Authorization: 'Bearer tok2' });
  });

  it('pide la tabla paginada y ordenada, y la lista de semilleros sin el seleccionado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal('fetch', fetchMock);
    await getRendimiento('ADMIN', { ...EMPTY_FILTERS, idCampus: '9' }, 2, { orden: 'participantes', direccion: 'desc' }, 'tok');
    await getSemillerosReporte('COORDINADOR', { ...EMPTY_FILTERS, idSemillero: '4', idUnidad: '1' }, 'tok');
    const tabla = new URL(fetchMock.mock.calls[0][0]);
    expect(tabla.pathname).toBe('/api/v1/admin/reportes/rendimiento');
    expect(Object.fromEntries(tabla.searchParams)).toEqual({ idCampus: '9', pagina: '2', tamano: '10', orden: 'participantes', direccion: 'desc' });
    const lista = new URL(fetchMock.mock.calls[1][0]);
    expect(lista.pathname).toBe('/api/v1/coordinador/reportes/semilleros');
    expect(lista.searchParams.has('idSemillero')).toBe(false);
  });

  it('descarga el archivo exportado con el nombre que envía el backend (RN36)', async () => {
    const archivo = new Blob(['a;b']);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, blob: async () => archivo,
      headers: new Headers({ 'Content-Disposition': 'attachment; filename="reporte_sigsi_2026-09-24_1030.xlsx"' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const resultado = await exportarReporte('xlsx', { ...EMPTY_FILTERS, periodo: '2026' }, { orden: 'nombre', direccion: 'asc' }, 'tok');
    expect(resultado).toEqual({ nombre: 'reporte_sigsi_2026-09-24_1030.xlsx', archivo });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/admin/reportes/exportar');
    expect(url.searchParams.get('formato')).toBe('xlsx');
    expect(url.searchParams.get('periodo')).toBe('2026');
  });

  it('informa el error del backend al exportar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ mensaje: 'Formato no soportado' }) }));
    await expect(exportarReporte('pdf', EMPTY_FILTERS, { orden: 'nombre', direccion: 'asc' }, 'tok')).rejects.toThrow('Formato no soportado');
  });

  it('separa eventos SSE aunque lleguen partidos', () => {
    const primero = parsearEventos('event:conectado\ndata:{"intervaloMs":60000}\n\n:latido\n\nevent:datos-act');
    expect(primero.eventos).toEqual([{ evento: 'conectado', datos: '{"intervaloMs":60000}' }]);
    const segundo = parsearEventos(`${primero.resto}ualizados\r\ndata:{}\r\n\r\n`);
    expect(segundo.eventos).toEqual([{ evento: 'datos-actualizados', datos: '{}' }]);
    expect(segundo.resto).toBe('');
  });

  it('escucha el flujo de eventos con el token del administrador (HU13)', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event:conectado\ndata:{}\n\n'));
        controller.enqueue(encoder.encode('event:datos-actualizados\ndata:{}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body });
    vi.stubGlobal('fetch', fetchMock);
    const recibidos: string[] = [];
    await escucharEventosReportes('tok', evento => recibidos.push(evento.evento), new AbortController().signal);
    expect(recibidos).toEqual(['conectado', 'datos-actualizados']);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/api/v1/admin/reportes/eventos');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('rechaza la suscripción si el servidor no la acepta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(escucharEventosReportes('tok', () => {}, new AbortController().signal)).rejects.toThrow('Error 403');
  });
});
