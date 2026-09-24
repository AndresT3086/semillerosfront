import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  actualizarSesion, eliminarSesion, getAsistenciaIntegrantes, getSesion, getSesiones, registrarSesion,
  type IntegranteAsistencia, type Sesion,
} from '../api/asistenciaApi';
import { getPestanaActividades } from '../api/semillerosApi';
import AsistenciaPage from './AsistenciaPage';

vi.mock('../api/asistenciaApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/asistenciaApi')>()),
  getSesiones: vi.fn(), getSesion: vi.fn(), getAsistenciaIntegrantes: vi.fn(),
  registrarSesion: vi.fn(), actualizarSesion: vi.fn(), eliminarSesion: vi.fn(),
}));
vi.mock('../api/semillerosApi', () => ({ getPestanaActividades: vi.fn() }));

const sesiones: Sesion[] = [
  { id: 3, idSemillero: 10, idActividad: 4, actividad: 'Talleres', titulo: 'Taller de escritura', fecha: '2026-09-20', asistencia: { presentes: 8, ausentes: 1, excusados: 1, porcentaje: 88.9 } },
  { id: 2, idSemillero: 10, titulo: 'Reunión', fecha: '2026-09-01', asistencia: { presentes: 4, ausentes: 3, excusados: 0, porcentaje: 57.1 } },
];
const integrantes: IntegranteAsistencia[] = [
  { idIntegrante: 1, nombre: 'Ana Zapata', cedula: '111', activo: true, asistencia: { presentes: 2, ausentes: 0, excusados: 0, porcentaje: 100 } },
  { idIntegrante: 2, nombre: 'Beto Arias', cedula: '222', activo: true, asistencia: { presentes: 1, ausentes: 2, excusados: 1, porcentaje: 33.3 } },
  { idIntegrante: 3, nombre: 'Carla Mejía', cedula: '333', activo: false, asistencia: { presentes: 1, ausentes: 0, excusados: 0, porcentaje: 100 } },
];
const props = { token: 'tok', idSemillero: 10, nombreSemillero: 'Semillero IA', onBack: () => {}, onLogout: () => {} };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSesiones).mockResolvedValue(sesiones);
  vi.mocked(getAsistenciaIntegrantes).mockResolvedValue(integrantes);
  vi.mocked(getPestanaActividades).mockResolvedValue({ actividades: [{ idActividad: 4, nombre: 'Talleres', categoria: 'Formativas', realiza: true }] });
});
afterEach(() => vi.restoreAllMocks());

it('resume la asistencia del semillero sumando esperadas y señala integrantes con baja asistencia', async () => {
  render(<AsistenciaPage {...props} />);
  const resumen = within(screen.getByRole('region', { name: 'Resumen de asistencia' }));
  expect(await resumen.findByText('75,0 %')).toBeInTheDocument();
  expect(resumen.getByText('12 presentes de 16 esperadas · 1 excusadas')).toBeInTheDocument();
  expect(resumen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Baja asistencia')).toBeInTheDocument();
  expect(screen.getByText(/333 · Retirado/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Asistencia de Reunión' })).toHaveAttribute('aria-valuenow', '57.1');
});

it('filtra por período', async () => {
  render(<AsistenciaPage {...props} />);
  await screen.findByText('Taller de escritura');
  fireEvent.change(screen.getByLabelText('Período'), { target: { value: '2026-2' } });
  await waitFor(() => expect(getSesiones).toHaveBeenLastCalledWith(10, '2026-2', 'tok'));
  expect(getAsistenciaIntegrantes).toHaveBeenLastCalledWith(10, '2026-2', 'tok');
});

it('registra una actividad con la lista de integrantes activos marcados como presentes', async () => {
  vi.mocked(registrarSesion).mockResolvedValue({ sesion: sesiones[0], asistencias: [] });
  render(<AsistenciaPage {...props} />);
  await screen.findByText('Taller de escritura');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar actividad' }));
  expect(screen.getByText('Lista de asistencia (2 integrantes)')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Título *'), { target: { value: ' Club de revista ' } });
  fireEvent.change(screen.getByLabelText('Fecha *'), { target: { value: '2026-09-22' } });
  fireEvent.change(screen.getByLabelText('Tipo de actividad'), { target: { value: '4' } });
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Asistencia de Beto Arias' })).getByLabelText('Excusado'));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar asistencia' }));
  await waitFor(() => expect(registrarSesion).toHaveBeenCalledWith(10, {
    titulo: 'Club de revista', fecha: '2026-09-22', idActividad: 4,
    asistencias: [{ idIntegrante: 1, estado: 'PRESENTE' }, { idIntegrante: 2, estado: 'EXCUSADO' }],
  }, 'tok'));
  expect(await screen.findByText('Actividad registrada.')).toBeInTheDocument();
  expect(getSesiones).toHaveBeenCalledTimes(2);
});

it('corrige la asistencia de una actividad existente y muestra errores del backend', async () => {
  vi.mocked(getSesion).mockResolvedValue({ sesion: sesiones[1], asistencias: [
    { idIntegrante: 1, nombre: 'Ana Zapata', cedula: '111', estado: 'AUSENTE' },
  ] });
  vi.mocked(actualizarSesion).mockRejectedValueOnce(new Error('No se puede registrar asistencia de una fecha futura.'));
  render(<AsistenciaPage {...props} />);
  await screen.findByText('Reunión');
  fireEvent.click(screen.getByRole('button', { name: 'Editar Reunión' }));
  expect(await screen.findByDisplayValue('Reunión')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Marcar todos presentes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar asistencia' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('fecha futura');
  expect(actualizarSesion).toHaveBeenCalledWith(2, expect.objectContaining({ idActividad: null, asistencias: [{ idIntegrante: 1, estado: 'PRESENTE' }] }), 'tok');
});

it('elimina una actividad tras confirmar', async () => {
  vi.mocked(eliminarSesion).mockResolvedValue();
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<AsistenciaPage {...props} />);
  await screen.findByText('Reunión');
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Reunión' }));
  expect(eliminarSesion).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Reunión' }));
  await waitFor(() => expect(eliminarSesion).toHaveBeenCalledWith(2, 'tok'));
  expect(await screen.findByText('Actividad eliminada.')).toBeInTheDocument();
  expect(confirmar).toHaveBeenCalledTimes(2);
});
