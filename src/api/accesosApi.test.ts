import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activarCuenta, aprobarSolicitud, contarSolicitudesPendientes, contrasenaValida, esCorreoInstitucional,
  getSolicitudesAcceso, invitarCoordinador, rechazarSolicitud, solicitarAcceso, verificarCorreo,
} from './accesosApi';

function respuesta(ok: boolean, body: unknown, status = ok ? 200 : 400) {
  return { ok, status, json: async () => body };
}
afterEach(() => vi.unstubAllGlobals());

describe('accesosApi', () => {
  it('envía la solicitud, la verificación y la activación a los endpoints públicos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, { mensaje: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    const datos = { nombres: 'Ana', apellidos: 'Zapata', cedula: '1040123456', correo: 'ana@udea.edu.co', idUnidadAcademica: 1,
      justificacion: 'Coordino el semillero de IA aplicada', sitioWeb: '', respuestaMath: 7, operando1: 3, operando2: 4 };
    expect(await solicitarAcceso(datos)).toBe('ok');
    await verificarCorreo('t1');
    await activarCuenta('t2', 'Semilleros2026');
    expect(fetchMock.mock.calls.map(c => new URL(c[0]).pathname)).toEqual([
      '/api/v1/solicitudes-acceso', '/api/v1/solicitudes-acceso/verificar', '/api/v1/cuenta/activar',
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(datos);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ token: 't2', contrasena: 'Semilleros2026' });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('muestra los mensajes de validación del backend', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(respuesta(false, { mensaje: 'Datos inválidos', datos: { cedula: 'La cédula debe tener entre 7 y 10 dígitos' } }))
      .mockResolvedValueOnce(respuesta(false, { mensaje: 'El enlace no es válido o ya venció.' }))
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error('sin cuerpo'); } }));
    await expect(verificarCorreo('x')).rejects.toThrow('La cédula debe tener entre 7 y 10 dígitos');
    await expect(verificarCorreo('x')).rejects.toThrow('El enlace no es válido o ya venció.');
    await expect(verificarCorreo('x')).rejects.toThrow('Error 500');
  });

  it('usa el token del administrador para revisar solicitudes e invitar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, { mensaje: 'hecho', datos: { pendientes: 2 } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await contarSolicitudesPendientes('tok')).toBe(2);
    await getSolicitudesAcceso('tok');
    expect(await aprobarSolicitud(5, 'tok')).toEqual({ mensaje: 'hecho', correoEnviado: true });
    await rechazarSolicitud(5, 'No coordina', true, 'tok');
    await invitarCoordinador({ nombres: 'Ana', apellidos: 'Zapata', correo: 'ana@udea.edu.co' }, 'tok');
    const rutas = fetchMock.mock.calls.map(c => { const u = new URL(c[0]); return u.pathname + u.search; });
    expect(rutas).toEqual([
      '/api/v1/admin/solicitudes-acceso/resumen', '/api/v1/admin/solicitudes-acceso?estado=PENDIENTE',
      '/api/v1/admin/solicitudes-acceso/5/aprobar', '/api/v1/admin/solicitudes-acceso/5/rechazar', '/api/v1/admin/invitaciones',
    ]);
    expect(fetchMock.mock.calls.every(c => c[1].headers.Authorization === 'Bearer tok')).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ motivo: 'No coordina', bloquear: true });
  });

  it('informa cuando la cuenta quedó registrada pero el correo no salió', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(true, { mensaje: 'sin correo', datos: { correoEnviado: false } })));
    expect(await invitarCoordinador({ nombres: 'Ana', apellidos: 'Zapata', correo: 'ana@udea.edu.co' }, 'tok'))
      .toEqual({ mensaje: 'sin correo', correoEnviado: false });
    expect(await aprobarSolicitud(5, 'tok')).toEqual({ mensaje: 'sin correo', correoEnviado: false });
  });

  it('valida correo institucional y contraseña con las mismas reglas del backend', () => {
    expect(esCorreoInstitucional(' Ana.Zapata@UDEA.edu.co ')).toBe(true);
    expect(esCorreoInstitucional('@udea.edu.co')).toBe(false);
    expect(esCorreoInstitucional('ana@gmail.com')).toBe(false);
    expect(esCorreoInstitucional('ana@udea.edu.co.evil.com')).toBe(false);
    expect(contrasenaValida('Semilleros2026')).toBe(true);
    expect(contrasenaValida('Ñandú123456')).toBe(true);
    expect(contrasenaValida('corta1')).toBe(false);
    expect(contrasenaValida('sinnumerosaqui')).toBe(false);
    expect(contrasenaValida('12345678901')).toBe(false);
  });
});
