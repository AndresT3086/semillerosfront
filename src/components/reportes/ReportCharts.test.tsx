import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KpiCards from './KpiCards';
import TopFacultades from './TopFacultades';
import EvolutionChart from './EvolutionChart';
import ActivitiesByType from './ActivitiesByType';
import RendimientoTable from './RendimientoTable';
import AttendanceSummary from './AttendanceSummary';
import type { ReporteKpis, ReporteRendimiento } from '../../api/reportesApi';

const kpis: ReporteKpis = {
  semillerosActivos: 1200, usuariosRegistrados: 10, miembrosActivos: 8, actividadesRealizadas: 3, tasaParticipacion: 80,
  tendencias: { semillerosActivos: 20, usuariosRegistrados: -5 }, periodoComparado: '2024', fechaCalculo: '2026-09-24T10:30:00', alcance: 'ADMIN',
};

describe('KpiCards (HU1)', () => {
  it('muestra los cuatro indicadores con su tendencia frente al período anterior', () => {
    render(<KpiCards kpis={kpis} loading={false} />);
    const region = within(screen.getByRole('region', { name: 'Indicadores clave' }));
    expect(region.getByText('1.200')).toBeInTheDocument();
    expect(region.getByText('80,0 %')).toBeInTheDocument();
    expect(region.getByText('+20,0 % vs 2024')).toBeInTheDocument();
    expect(region.getByText('-5,0 % vs 2024')).toHaveClass('report-trend', 'is-down');
    expect(region.getAllByRole('tooltip', { hidden: true })).toHaveLength(4);
    expect(region.getByText('Variación frente a 2024: +20,0 %.')).toBeInTheDocument();
  });

  it('distingue información no disponible de cero', () => {
    render(<KpiCards kpis={{ ...kpis, tasaParticipacion: undefined, tendencias: {} }} loading={false} />);
    const region = within(screen.getByRole('region', { name: 'Indicadores clave' }));
    expect(region.getByText('—')).toBeInTheDocument();
    expect(region.getAllByText('Tendencia no disponible')).toHaveLength(4);
  });
});

describe('TopFacultades (HU6)', () => {
  it('lista las facultades con su cantidad exacta y filtra al hacer clic (RN23)', () => {
    const select = vi.fn();
    const rows = [1, 2, 3, 4, 5, 6].map(id => ({ id, nombre: `Facultad ${id}`, tipo: 'FACULTAD' as const, semilleros: id === 6 ? 1 : 10 - id, estudiantes: 0 }));
    rows[5].semilleros = rows[4].semilleros;
    render(<TopFacultades rows={rows} selectedId="" onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: '1. Facultad 1: 9 semilleros' }));
    expect(select).toHaveBeenCalledWith('1');
    expect(screen.getByText(/por empate en el quinto puesto/)).toBeInTheDocument();
  });
});

describe('EvolutionChart (HU7)', () => {
  it('muestra año y cantidad exacta al pasar sobre un punto e identifica la proyección', () => {
    render(<EvolutionChart puntos={[
      { anio: 2022, semillerosActivos: 2, nuevos: 2, proyectado: false },
      { anio: 2023, semillerosActivos: 5, nuevos: 3, proyectado: false },
      { anio: 2024, semillerosActivos: 7, nuevos: 2, proyectado: true },
    ]} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: '2023: 5 semilleros activos' }));
    expect(screen.getByRole('status')).toHaveTextContent('2023: 5 semilleros activos · 3 creados ese año');
    fireEvent.focus(screen.getByRole('button', { name: '2024: 7 semilleros activos (proyección)' }));
    expect(screen.getByRole('status')).toHaveTextContent('2024: 7 semilleros activos (proyección)');
    expect(screen.getByText(/Proyección lineal para 2024/)).toBeInTheDocument();
  });

  it('informa cuando no hay histórico', () => {
    render(<EvolutionChart puntos={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No hay semilleros con año de creación');
  });
});

describe('ActivitiesByType (HU8)', () => {
  it('muestra cantidad absoluta y porcentaje de cada tipo (RN30)', () => {
    render(<ActivitiesByType rows={[{ id: '1', nombre: 'Talleres', cantidad: 3 }, { id: '2', nombre: 'Seminarios', cantidad: 1 }, { id: '3', nombre: 'Reuniones', cantidad: 0 }]} />);
    expect(screen.getByText('3 · 75,0 %')).toBeInTheDocument();
    expect(screen.getByText('0 · 0,0 %')).toBeInTheDocument();
  });

  it('informa cuando no hay actividades', () => {
    render(<ActivitiesByType rows={[{ id: '1', nombre: 'Talleres', cantidad: 0 }]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No hay actividades registradas');
  });
});

describe('RendimientoTable (HU9)', () => {
  const filas: ReporteRendimiento[] = [
    { id: 1, nombre: 'Semillero IA', codigo: 'SEM-1', unidadAcademica: 'Facultad de Ingeniería', tipoUnidad: 'FACULTAD', campus: 'Medellín', participantes: 12, actividadesRealizadas: 4, sesiones: 9, estado: 'ACTIVO' },
    { id: 2, nombre: 'Lenguas', codigo: 'SEM-2', unidadAcademica: 'Escuela de Idiomas', tipoUnidad: 'ESCUELA', participantes: 3, actividadesRealizadas: 0, sesiones: 2, porcentajeAsistencia: 87.5, estado: 'INACTIVO' },
  ];
  const page = { contenido: filas, paginaActual: 0, tamano: 10, totalElementos: 12, totalPaginas: 2, esPrimeraPagina: true, esUltimaPagina: false };

  it('ordena por columna alternando la dirección y pagina', () => {
    const onOrden = vi.fn();
    const onPagina = vi.fn();
    render(<RendimientoTable page={page} orden={{ orden: 'participantes', direccion: 'asc' }} onOrden={onOrden} onPagina={onPagina} onAbrir={() => {}} />);
    expect(screen.getByRole('columnheader', { name: /Participantes/ })).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Participantes' }));
    expect(onOrden).toHaveBeenCalledWith({ orden: 'participantes', direccion: 'desc' });
    fireEvent.click(screen.getByRole('button', { name: 'Semillero' }));
    expect(onOrden).toHaveBeenCalledWith({ orden: 'nombre', direccion: 'asc' });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: '% Asistencia' }));
    expect(onOrden).toHaveBeenCalledWith({ orden: 'asistencia', direccion: 'asc' });
    expect(onPagina).toHaveBeenCalledWith(1);
  });

  it('muestra estado con color, asistencia y abre el detalle al hacer clic (RN32-RN34)', () => {
    const onAbrir = vi.fn();
    render(<RendimientoTable page={page} orden={{ orden: 'nombre', direccion: 'asc' }} onOrden={() => {}} onPagina={() => {}} onAbrir={onAbrir} />);
    expect(screen.getByText('Activo')).toHaveClass('is-active');
    expect(screen.getByText('Inactivo')).toHaveClass('is-inactive');
    expect(screen.getByText('Sin registros')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Asistencia de Lenguas' })).toHaveAttribute('aria-valuenow', '87.5');
    fireEvent.click(screen.getByRole('row', { name: 'Ver detalle de Semillero IA' }));
    expect(onAbrir).toHaveBeenCalledWith(1);
    fireEvent.keyDown(screen.getByRole('row', { name: 'Ver detalle de Lenguas' }), { key: 'Enter' });
    expect(onAbrir).toHaveBeenCalledWith(2);
  });
});

describe('AttendanceSummary (HU9)', () => {
  it('muestra la asistencia ponderada y sus totales', () => {
    render(<AttendanceSummary datos={{ sesiones: 6, asistencia: { presentes: 45, ausentes: 5, excusados: 2, porcentaje: 90 } }} />);
    expect(screen.getByText('90,0 %')).toBeInTheDocument();
    expect(screen.getByText('Asistencias esperadas').nextSibling).toHaveTextContent('50');
    expect(screen.getByText('Ausencias excusadas').nextSibling).toHaveTextContent('2');
  });

  it('informa cuando no hay actividades registradas', () => {
    render(<AttendanceSummary datos={{ sesiones: 0, asistencia: { presentes: 0, ausentes: 0, excusados: 0 } }} />);
    expect(screen.getByRole('status')).toHaveTextContent('No hay actividades con asistencia registrada');
  });
});
