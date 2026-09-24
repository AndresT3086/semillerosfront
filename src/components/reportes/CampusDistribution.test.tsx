import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import CampusDistribution, { CampusChart } from './CampusDistribution';

it('ordena badges, muestra cantidades y permite seleccionar segmentos por teclado', () => {
  const select = vi.fn();
  render(<CampusChart rows={[{ id: '2', nombre: 'Oriente', cantidad: 0 }, { id: '1', nombre: 'Medellín', cantidad: 5 }]} selectedId="" onSelect={select} />);
  const badges = screen.getAllByRole('listitem');
  expect(badges[0]).toHaveTextContent('Medellín5');
  expect(badges[1]).toHaveTextContent('Oriente0');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Medellín: 5 semilleros' }), { key: 'Enter' });
  expect(select).toHaveBeenCalledWith('1');
  fireEvent.click(screen.getByRole('button', { name: 'Oriente 0' }));
  expect(select).toHaveBeenCalledWith('2');
});

it('muestra estado vacío sin inventar sectores con valores cero', () => {
  render(<CampusChart rows={[{ id: '1', nombre: 'Medellín', cantidad: 0 }]} selectedId="" onSelect={() => {}} />);
  expect(screen.getByText(/No hay semilleros en los campus/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Medellín: 0 semilleros' })).not.toBeInTheDocument();
});

it('permite volver a todos los campus desde una sede seleccionada', () => {
  const select = vi.fn();
  render(<CampusDistribution rows={[{ id: '1', nombre: 'Medellín', cantidad: 2 }]} selectedId="1" onSelect={select} />);
  expect(screen.getByRole('button', { name: 'Medellín 2' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Ver todos los campus' }));
  expect(select).toHaveBeenCalledWith('');
});
