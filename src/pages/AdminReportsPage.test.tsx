import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getReportesDisponibles, getUnidades, getCatalogoReportes, getReporteSemillero, getDistribucionDisponible, getCampus, getDistribucionCampus } from '../api/semillerosApi';
import AdminReportsPage from './AdminReportsPage';
vi.mock('../api/semillerosApi', () => ({ getReportesDisponibles: vi.fn(), getUnidades: vi.fn(), getCatalogoReportes: vi.fn(), getReporteSemillero: vi.fn(), getDistribucionDisponible: vi.fn(), getCampus: vi.fn(), getDistribucionCampus: vi.fn() }));
const page = { contenido: [], totalElementos: 23, paginaActual: 0, totalPaginas: 3, tamano: 10, esPrimeraPagina: true, esUltimaPagina: false };
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.mocked(getCampus).mockResolvedValue([{ id: 9, nombre: 'Oriente', siglas: '' }]);
  vi.mocked(getDistribucionCampus).mockResolvedValue([]);
  vi.mocked(getDistribucionDisponible).mockResolvedValue([]);
  vi.mocked(getCatalogoReportes).mockResolvedValue([]);
  vi.mocked(getReportesDisponibles).mockResolvedValue(page);
  vi.mocked(getUnidades).mockResolvedValue([{ id: 2, nombre: 'Ingeniería', siglas: 'ING' }]);
});
it('usa el total del backend, deja los demás KPI sin inventar y actualiza al consultar de nuevo', async () => {
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  expect(await screen.findByText('23')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Indicadores clave' })).getAllByText('—')).toHaveLength(3);
  expect(within(screen.getByRole('region', { name: 'Indicadores clave' })).getAllByRole('tooltip', { hidden: true })).toHaveLength(4);
  vi.mocked(getReportesDisponibles).mockResolvedValue({ ...page, totalElementos: 24 });
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar datos' }));
  expect(await screen.findByText('24')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Unidad académica'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('2', 0, ''));
});
it('distingue cero real de información ausente y se recupera de errores', async () => {
  vi.mocked(getReportesDisponibles).mockRejectedValueOnce(new Error('offline'));
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos consultar');
  vi.mocked(getReportesDisponibles).mockResolvedValue({ ...page, totalElementos: 0, totalPaginas: 0, esUltimaPagina: true });
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('0')).toBeInTheDocument();
  expect(screen.getByText(/No se encontraron semilleros activos/)).toBeInTheDocument();
});

it('conserva el período aplicado al navegar y no consulta datos actuales como históricos', async () => {
  const props = { onBack: () => {}, onLogout: () => {} };
  const view = render(<AdminReportsPage {...props} />);
  await screen.findByText('23');
  fireEvent.change(screen.getByLabelText('Período académico'), { target: { value: '2025-1' } });
  const calls = vi.mocked(getReportesDisponibles).mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(await screen.findByText(/Consulta no disponible para/)).toBeInTheDocument();
  expect(getReportesDisponibles).toHaveBeenCalledTimes(calls);
  expect(screen.queryByText('23')).not.toBeInTheDocument();
  view.unmount();
  render(<AdminReportsPage {...props} />);
  expect(screen.getByLabelText('Período académico')).toHaveValue('2025-1');
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
  expect(await screen.findByText('23')).toBeInTheDocument();
});
it('consulta exclusivamente el semillero seleccionado', async () => {
  const item = { id: 4, nombre: 'Robótica', facultad: 'Ingeniería', campus: 'Medellín', totalActividadesCientificas: 3, estado: 'ACTIVO', codigo: 'R', siglas: 'R', anioCreacion: 2025, grupoInvestigacion: '', totalSemilleristas: 2 };
  vi.mocked(getCatalogoReportes).mockResolvedValue([item]);
  vi.mocked(getReporteSemillero).mockResolvedValue({ ...page, contenido: [item], totalElementos: 1, totalPaginas: 1, esUltimaPagina: true });
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  await screen.findByText('23');
  fireEvent.change(screen.getByLabelText('Semillero'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() => expect(getReporteSemillero).toHaveBeenCalledWith('4'));
  expect(await screen.findByRole('rowheader', { name: 'Robótica' })).toBeInTheDocument();
  expect(screen.queryByText('23')).not.toBeInTheDocument();
});

it('aplica la unidad de la barra a la API y persiste el filtro', async () => {
  vi.mocked(getDistribucionDisponible).mockResolvedValue([{ id: 2, nombre: 'Ingeniería', semilleros: 3, estudiantes: null }]);
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  const bar = await screen.findByRole('button', { name: 'Ingeniería 3' });
  fireEvent.click(bar);
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('2', 0, ''));
  expect(screen.getByLabelText('Unidad académica')).toHaveValue('2');
  expect(JSON.parse(sessionStorage.getItem('sigsi_report_filters')!).idUnidad).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: 'Ver todas las unidades' }));
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('', 0, ''));
});

it('filtra la tabla por campus y unidad desde el gráfico y conserva la selección', async () => {
  sessionStorage.setItem('sigsi_report_filters', JSON.stringify({ idUnidad: '2' }));
  vi.mocked(getDistribucionCampus).mockResolvedValue([{ id: 9, nombre: 'Oriente', semilleros: 4 }]);
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Oriente 4' }));
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('2', 0, '9'));
  expect(screen.getByLabelText('Campus o seccional')).toHaveValue('9');
  expect(JSON.parse(sessionStorage.getItem('sigsi_report_filters')!).idCampus).toBe('9');
  fireEvent.click(screen.getByRole('button', { name: 'Ver todos los campus' }));
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('2', 0, ''));
});
