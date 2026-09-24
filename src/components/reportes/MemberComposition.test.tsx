import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import MemberComposition, { CompositionChart } from './MemberComposition';

it('muestra cantidades y porcentajes calculados sin ocultar categorías adicionales', () => {
  render(<CompositionChart kind="sexo" items={[{ id: 'F', nombre: 'Femenino', cantidad: 6 }, { id: 'M', nombre: 'Masculino', cantidad: 3 }, { id: 'N', nombre: 'No informado', cantidad: 1 }]} />);
  expect(screen.getByRole('progressbar', { name: 'Femenino' })).toHaveAttribute('aria-valuenow', '60');
  expect(screen.getByRole('progressbar', { name: 'No informado' })).toHaveAttribute('aria-valuenow', '10');
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

it('grafica sexo y roles con los datos del tablero (HU5)', () => {
  render(<MemberComposition
    sexo={[{ id: 'FEMENINO', nombre: 'Femenino', cantidad: 3 }, { id: 'MASCULINO', nombre: 'Masculino', cantidad: 1 }]}
    roles={[{ id: 'ESTUDIANTE_INVESTIGADOR', nombre: 'Estudiante Investigador', cantidad: 4 }, { id: 'TUTOR', nombre: 'Tutor', cantidad: 1 }]} />);
  expect(screen.getByRole('img', { name: 'Distribución por sexo: 4 integrantes' })).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Estudiante Investigador' })).toHaveAttribute('aria-valuenow', '80');
  expect(screen.queryByText('Datos no disponibles para la selección aplicada.')).not.toBeInTheDocument();
});
