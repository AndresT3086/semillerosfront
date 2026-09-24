import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import MemberComposition, { CompositionChart } from './MemberComposition';
import { EMPTY_FILTERS } from '../../reports/filters';
it('muestra cantidades y porcentajes calculados sin ocultar categorías adicionales', () => {
  render(<CompositionChart kind="sexo" items={[{ id: 'F', nombre: 'Femenino', cantidad: 6 }, { id: 'M', nombre: 'Masculino', cantidad: 3 }, { id: 'N', nombre: 'Sin informar', cantidad: 1 }]} />);
  expect(screen.getByRole('progressbar', { name: 'Femenino' })).toHaveAttribute('aria-valuenow', '60');
  expect(screen.getByRole('progressbar', { name: 'Sin informar' })).toHaveAttribute('aria-valuenow', '10');
  expect(screen.getByText('6 · 60 %')).toBeInTheDocument();
});
it('distingue cero real de datos desconocidos', () => {
  const view = render(<CompositionChart kind="roles" items={null} />);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByText('Semillerista Junior')).toBeInTheDocument();
  view.rerender(<CompositionChart kind="roles" items={[{ id: 'T', nombre: 'Tutor', cantidad: 0 }]} />);
  expect(screen.getByText('0 · 0 %')).toBeInTheDocument();
  expect(screen.getByText(/No hay asignaciones/)).toBeInTheDocument();
});
it('conserva el estado sin datos al cambiar todos los filtros', () => {
  const view = render(<MemberComposition filters={EMPTY_FILTERS} />);
  view.rerender(<MemberComposition filters={{ periodo: '2025-1', tipoUnidad: 'FACULTAD', idUnidad: '2', idCampus: '3', idSemillero: '4' }} />);
  expect(screen.getByText(/Composición para:/)).toHaveTextContent('2025-1 · FACULTAD · Unidad #2 · Campus #3 · Semillero #4');
  expect(screen.getAllByText('Datos no disponibles para la selección aplicada.')).toHaveLength(2);
});
