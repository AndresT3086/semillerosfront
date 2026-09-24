import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarSesion, eliminarSesion, getAsistenciaIntegrantes, getSesion, getSesiones, registrarSesion, sumarAsistencia,
} from './asistenciaApi';

function response(datos: unknown) { return { ok: true, json: async () => ({ datos }) }; }
afterEach(() => vi.unstubAllGlobals());

describe('asistenciaApi', () => {
  it('consulta sesiones y asistencia por integrante con el período y el token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal('fetch', fetchMock);
    await getSesiones(10, '2026-2', 'tok');
    await getAsistenciaIntegrantes(10, '', 'tok');
    await getSesion(3, 'tok');
    const urls = fetchMock.mock.calls.map(call => new URL(call[0]));
    expect(urls[0].pathname).toBe('/api/v1/coordinador/semilleros/10/sesiones');
    expect(urls[0].searchParams.get('periodo')).toBe('2026-2');
    expect(urls[1].pathname).toBe('/api/v1/coordinador/semilleros/10/asistencia/integrantes');
    expect(urls[1].search).toBe('');
    expect(urls[2].pathname).toBe('/api/v1/coordinador/semilleros/sesiones/3');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer tok' });
  });

  it('registra, corrige y elimina sesiones', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}));
    vi.stubGlobal('fetch', fetchMock);
    const datos = { titulo: 'Taller', fecha: '2026-09-20', idActividad: 4, asistencias: [{ idIntegrante: 1, estado: 'PRESENTE' as const }] };
    await registrarSesion(10, datos, 'tok');
    await actualizarSesion(3, datos, 'tok');
    await eliminarSesion(3, 'tok');
    expect(fetchMock.mock.calls.map(call => [new URL(call[0]).pathname, call[1].method])).toEqual([
      ['/api/v1/coordinador/semilleros/10/sesiones', 'POST'],
      ['/api/v1/coordinador/semilleros/sesiones/3', 'PUT'],
      ['/api/v1/coordinador/semilleros/sesiones/3', 'DELETE'],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(datos);
  });

  it('suma asistencias descontando excusas', () => {
    expect(sumarAsistencia([{ presentes: 8, ausentes: 1, excusados: 1 }, { presentes: 4, ausentes: 3, excusados: 0 }]))
      .toEqual({ presentes: 12, ausentes: 4, excusados: 1, porcentaje: 75 });
    expect(sumarAsistencia([{ presentes: 0, ausentes: 0, excusados: 2 }])).toEqual({ presentes: 0, ausentes: 0, excusados: 2 });
  });
});
