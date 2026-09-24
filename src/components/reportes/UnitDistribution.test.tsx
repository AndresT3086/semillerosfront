import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import UnitDistribution, { DistributionBars } from './UnitDistribution';
import { getDistribucionDisponible } from '../../api/semillerosApi';
vi.mock('../../api/semillerosApi', () => ({ getDistribucionDisponible: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it('presenta valores exactos, tooltip y selección por ID, incluyendo cero', () => {
  const select = vi.fn();
  render(<DistributionBars metric="estudiantes" selectedId="" onSelect={select} rows={[{ id: 7, nombre: 'Artes', semilleros: 1, estudiantes: 42 }, { id: 8, nombre: 'Escuela', semilleros: 0, estudiantes: 0 }]} />);
  expect(screen.getByText('Artes: 42 estudiantes. Selecciona para filtrar la tabla.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Artes 42' }));
  expect(select).toHaveBeenCalledWith('7');
  expect(screen.getByRole('button', { name: 'Escuela 0' })).toBeEnabled();
});
it('distingue falta de datos de cero estudiantes', () => {
  render(<DistributionBars metric="estudiantes" selectedId="" onSelect={() => {}} rows={[{ id: 7, nombre: 'Artes', semilleros: 1, estudiantes: null }]} />);
  expect(screen.getByText('Distribución no disponible')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('permite reintentar una consulta fallida', async () => {
  vi.mocked(getDistribucionDisponible).mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ id: 7, nombre: 'Artes', semilleros: 2, estudiantes: null }]);
  render(<UnitDistribution revision={0} selectedId="" unsupported={false} selectedSemillero={false} onSelect={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar gráficos' }));
  expect(await screen.findByRole('button', { name: 'Artes 2' })).toBeInTheDocument();
});
it('no consulta distribución global con filtros incompatibles', () => {
  render(<UnitDistribution revision={0} selectedId="" unsupported selectedSemillero={false} onSelect={() => {}} />);
  expect(getDistribucionDisponible).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('no está disponible');
});
