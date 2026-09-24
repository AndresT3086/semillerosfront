import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getReportesDisponibles, getUnidades } from '../api/semillerosApi';
import AdminReportsPage from './AdminReportsPage';
vi.mock('../api/semillerosApi', () => ({ getReportesDisponibles: vi.fn(), getUnidades: vi.fn() }));
const page = { contenido: [], totalElementos: 23, paginaActual: 0, totalPaginas: 3, tamano: 10, esPrimeraPagina: true, esUltimaPagina: false };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getReportesDisponibles).mockResolvedValue(page);
  vi.mocked(getUnidades).mockResolvedValue([{ id: 2, nombre: 'Ingeniería', siglas: 'ING' }]);
});
it('usa el total del backend, deja los demás KPI sin inventar y actualiza al consultar de nuevo', async () => {
  render(<AdminReportsPage onBack={() => {}} onLogout={() => {}} />);
  expect(await screen.findByText('23')).toBeInTheDocument();
  expect(screen.getAllByText('—')).toHaveLength(3);
  expect(screen.getAllByRole('tooltip', { hidden: true })).toHaveLength(4);
  vi.mocked(getReportesDisponibles).mockResolvedValue({ ...page, totalElementos: 24 });
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar datos' }));
  expect(await screen.findByText('24')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Unidad académica'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  await waitFor(() => expect(getReportesDisponibles).toHaveBeenLastCalledWith('2', 0));
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
