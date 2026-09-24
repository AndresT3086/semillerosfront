import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import CampusDistribution, { CampusChart } from './CampusDistribution';
import { getDistribucionCampus } from '../../api/semillerosApi';
vi.mock('../../api/semillerosApi', () => ({ getDistribucionCampus: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it('ordena badges, muestra cantidades y permite seleccionar segmentos por teclado', () => {
  const select = vi.fn();
  render(<CampusChart rows={[{ id: 2, nombre: 'Oriente', semilleros: 0 }, { id: 1, nombre: 'Medellín', semilleros: 5 }]} selectedId="" onSelect={select} />);
  const badges = screen.getAllByRole('listitem');
  expect(badges[0]).toHaveTextContent('Medellín5');
  expect(badges[1]).toHaveTextContent('Oriente0');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Medellín: 5 semilleros' }), { key: 'Enter' });
  expect(select).toHaveBeenCalledWith('1');
  fireEvent.click(screen.getByRole('button', { name: 'Oriente 0' }));
  expect(select).toHaveBeenCalledWith('2');
});
it('muestra estado vacío sin inventar sectores con valores cero', () => {
  render(<CampusChart rows={[{ id: 1, nombre: 'Medellín', semilleros: 0 }]} selectedId="" onSelect={() => {}} />);
  expect(screen.getByText(/No hay semilleros en los campus/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Medellín: 0 semilleros' })).not.toBeInTheDocument();
});
it('recarga ante cambio de unidad y oculta datos históricos no soportados', async () => {
  vi.mocked(getDistribucionCampus).mockResolvedValue([{ id: 1, nombre: 'Medellín', semilleros: 2 }]);
  const props = { selectedId: '', revision: 0, blocked: false, onSelect: () => {} };
  const view = render(<CampusDistribution {...props} idUnidad="" />);
  await screen.findByRole('button', { name: 'Medellín 2' });
  view.rerender(<CampusDistribution {...props} idUnidad="4" />);
  await screen.findByRole('button', { name: 'Medellín 2' });
  expect(getDistribucionCampus).toHaveBeenLastCalledWith('4', expect.any(AbortSignal));
  view.rerender(<CampusDistribution {...props} idUnidad="4" blocked />);
  expect(screen.queryByRole('button', { name: 'Medellín 2' })).not.toBeInTheDocument();
});
