import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import UnitDistribution, { DistributionBars } from './UnitDistribution';
import type { ReporteUnidad } from '../../api/reportesApi';

const rows: ReporteUnidad[] = [
  { id: 7, nombre: 'Facultad de Artes', tipo: 'FACULTAD', semilleros: 1, estudiantes: 42 },
  { id: 8, nombre: 'Escuela de Idiomas', tipo: 'ESCUELA', semilleros: 3, estudiantes: 0 },
];

it('presenta valores exactos, tipo de unidad, tooltip y selección por ID, incluyendo cero', () => {
  const select = vi.fn();
  render(<DistributionBars metric="estudiantes" selectedId="" onSelect={select} rows={rows} />);
  expect(screen.getByText('Facultad de Artes: 42 estudiantes. Selecciona para filtrar la tabla.')).toBeInTheDocument();
  expect(screen.getByText('Escuela')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Facultad de Artes 42' }));
  expect(select).toHaveBeenCalledWith('7');
  expect(screen.getByRole('button', { name: 'Escuela de Idiomas 0' })).toBeEnabled();
});

it('muestra semilleros y estudiantes, y permite quitar la unidad seleccionada', () => {
  const select = vi.fn();
  render(<UnitDistribution rows={rows} selectedId="7" onSelect={select} />);
  expect(screen.getByRole('button', { name: 'Escuela de Idiomas 3' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Facultad de Artes 42' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Ver todas las unidades' }));
  expect(select).toHaveBeenCalledWith('');
});

it('informa cuando no hay unidades con semilleros para los filtros', () => {
  render(<UnitDistribution rows={[]} selectedId="" onSelect={() => {}} />);
  expect(screen.getByRole('status')).toHaveTextContent('No hay semilleros activos');
});
