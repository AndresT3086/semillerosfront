import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCampus, getUnidades } from '../api/semillerosApi';
import { getDashboard, getRendimiento, getSemillerosReporte, type ReporteDashboard } from '../api/reportesApi';
import { EMPTY_FILTERS } from '../reports/filters';
import ReportsPage from './ReportsPage';

vi.mock('../api/semillerosApi', () => ({ getUnidades: vi.fn(), getCampus: vi.fn() }));
vi.mock('../api/reportesApi', () => ({ getDashboard: vi.fn(), getRendimiento: vi.fn(), getSemillerosReporte: vi.fn() }));
vi.mock('../components/DetailsModal', () => ({
  default: ({ semilleroId, isOpen }: { semilleroId: number | null; isOpen: boolean }) => isOpen ? <div role="dialog">Detalle {semilleroId}</div> : null,
}));

const dashboard: ReporteDashboard = {
  kpis: { semillerosActivos: 7, usuariosRegistrados: 10, miembrosActivos: 5, actividadesRealizadas: 3, tasaParticipacion: 50, tendencias: { semillerosActivos: 40 }, periodoComparado: 'mes anterior', fechaCalculo: '2026-09-24T10:00:00', alcance: 'ADMIN' },
  porUnidad: [{ id: 2, nombre: 'Facultad de Ingeniería', tipo: 'FACULTAD', semilleros: 3, estudiantes: 12 }],
  porCampus: [{ id: '9', nombre: 'Oriente', cantidad: 4 }],
  topFacultades: [{ id: 2, nombre: 'Facultad de Ingeniería', tipo: 'FACULTAD', semilleros: 3, estudiantes: 12 }],
  porSexo: [{ id: 'FEMENINO', nombre: 'Femenino', cantidad: 3 }, { id: 'MASCULINO', nombre: 'Masculino', cantidad: 2 }],
  porRol: [{ id: 'TUTOR', nombre: 'Tutor', cantidad: 1 }],
  evolucion: [{ anio: 2025, semillerosActivos: 5, nuevos: 5, proyectado: false }, { anio: 2026, semillerosActivos: 7, nuevos: 2, proyectado: false }],
  actividadesPorTipo: [{ id: '1', nombre: 'Talleres', cantidad: 2 }],
};
const tabla = {
  contenido: [{ id: 4, nombre: 'Robótica', codigo: 'SEM-4', unidadAcademica: 'Facultad de Ingeniería', tipoUnidad: 'FACULTAD' as const, participantes: 6, actividadesRealizadas: 2, estado: 'ACTIVO' as const }],
  paginaActual: 0, tamano: 10, totalElementos: 1, totalPaginas: 1, esPrimeraPagina: true, esUltimaPagina: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.mocked(getUnidades).mockResolvedValue([{ id: 2, nombre: 'Facultad de Ingeniería', siglas: 'FING' }]);
  vi.mocked(getCampus).mockResolvedValue([{ id: 9, nombre: 'Oriente', siglas: '' }]);
  vi.mocked(getDashboard).mockResolvedValue(dashboard);
  vi.mocked(getRendimiento).mockResolvedValue(tabla);
  vi.mocked(getSemillerosReporte).mockResolvedValue([{ id: 4, nombre: 'Robótica' }]);
});

const renderAdmin = () => render(<ReportsPage alcance="ADMIN" token="tok" onBack={() => {}} onLogout={() => {}} />);

describe('ReportsPage - administrador', () => {
  it('carga KPIs, gráficos y tabla con los filtros de la URL (RN51)', async () => {
    window.history.replaceState(null, '', '/?periodo=2025-1&tipoUnidad=FACULTAD');
    renderAdmin();
    const kpis = within(screen.getByRole('region', { name: 'Indicadores clave' }));
    expect(await kpis.findByText('7')).toBeInTheDocument();
    expect(kpis.getByText('50,0 %')).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledWith('ADMIN', { ...EMPTY_FILTERS, periodo: '2025-1', tipoUnidad: 'FACULTAD' }, 'tok', expect.any(AbortSignal));
    expect(await screen.findByRole('rowheader', { name: /Robótica/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Top 5 Facultades con más Semilleros' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evolución Semilleros' })).toBeInTheDocument();
    expect(screen.getByText(/Filtros aplicados: 2025-1 · Facultad/)).toBeInTheDocument();
  });

  it('aplica filtros con el botón, actualiza gráficos y tabla y guarda la selección en la URL (HU2, HU14)', async () => {
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    fireEvent.change(screen.getByLabelText('Semillero'), { target: { value: '4' } });
    expect(getDashboard).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => expect(getDashboard).toHaveBeenLastCalledWith('ADMIN', { ...EMPTY_FILTERS, idSemillero: '4' }, 'tok', expect.any(AbortSignal)));
    await waitFor(() => expect(getRendimiento).toHaveBeenLastCalledWith('ADMIN', { ...EMPTY_FILTERS, idSemillero: '4' }, 0, { orden: 'nombre', direccion: 'asc' }, 'tok', expect.any(AbortSignal)));
    expect(window.location.search).toBe('?idSemillero=4');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('filtra por unidad y campus al hacer clic en los gráficos (HU3, HU4)', async () => {
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Facultad de Ingeniería 3' }));
    await waitFor(() => expect(getRendimiento).toHaveBeenLastCalledWith('ADMIN', expect.objectContaining({ idUnidad: '2' }), 0, expect.anything(), 'tok', expect.any(AbortSignal)));
    fireEvent.click(await screen.findByRole('button', { name: 'Oriente 4' }));
    await waitFor(() => expect(getDashboard).toHaveBeenLastCalledWith('ADMIN', expect.objectContaining({ idUnidad: '2', idCampus: '9' }), 'tok', expect.any(AbortSignal)));
    expect(screen.getByLabelText('Campus o seccional')).toHaveValue('9');
  });

  it('ordena la tabla desde el encabezado y abre el detalle del semillero (HU9)', async () => {
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    fireEvent.click(screen.getByRole('button', { name: 'Participantes' }));
    await waitFor(() => expect(getRendimiento).toHaveBeenLastCalledWith('ADMIN', EMPTY_FILTERS, 0, { orden: 'participantes', direccion: 'asc' }, 'tok', expect.any(AbortSignal)));
    fireEvent.click(await screen.findByRole('row', { name: 'Ver detalle de Robótica' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Detalle 4');
  });

  it('conserva los datos mostrados si la actualización falla (RN48)', async () => {
    renderAdmin();
    const kpis = within(screen.getByRole('region', { name: 'Indicadores clave' }));
    await kpis.findByText('7');
    vi.mocked(getDashboard).mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar datos' }));
    expect(await screen.findByText(/No pudimos consultar los indicadores/)).toBeInTheDocument();
    expect(kpis.getByText('7')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.queryByText(/No pudimos consultar los indicadores/)).not.toBeInTheDocument());
  });

  it('muestra un mensaje cuando no hay datos para los filtros (RN8)', async () => {
    vi.mocked(getDashboard).mockResolvedValue({ ...dashboard, kpis: { ...dashboard.kpis, semillerosActivos: 0 } });
    renderAdmin();
    expect(await screen.findByText(/No hay semilleros activos para los filtros seleccionados/)).toBeInTheDocument();
  });
});

describe('ReportsPage - público (HU12)', () => {
  it('muestra estadísticas agregadas sin tabla ni selector de semillero', async () => {
    window.history.replaceState(null, '', '/?idSemillero=4');
    render(<ReportsPage alcance="PUBLICO" backLabel="← Volver al portal" onBack={() => {}} />);
    expect(await within(screen.getByRole('region', { name: 'Indicadores clave' })).findByText('7')).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledWith('PUBLICO', EMPTY_FILTERS, undefined, expect.any(AbortSignal));
    expect(screen.queryByLabelText('Semillero')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rendimiento por semillero' })).not.toBeInTheDocument();
    expect(getRendimiento).not.toHaveBeenCalled();
    expect(getSemillerosReporte).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });
});
