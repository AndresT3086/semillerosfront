import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCampus, getUnidades } from '../api/semillerosApi';
import { descargarArchivo, escucharEventosReportes, exportarReporte, getDashboard, getRendimiento, getSemillerosReporte, type ReporteDashboard } from '../api/reportesApi';
import { EMPTY_FILTERS } from '../reports/filters';
import ReportsPage from './ReportsPage';

vi.mock('../api/semillerosApi', () => ({ getUnidades: vi.fn(), getCampus: vi.fn() }));
vi.mock('../api/reportesApi', () => ({ getDashboard: vi.fn(), getRendimiento: vi.fn(), getSemillerosReporte: vi.fn(), exportarReporte: vi.fn(), descargarArchivo: vi.fn(), escucharEventosReportes: vi.fn() }));
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
  asistencia: { sesiones: 6, asistencia: { presentes: 45, ausentes: 5, excusados: 2, porcentaje: 90 } },
};
const tabla = {
  contenido: [{ id: 4, nombre: 'Robótica', codigo: 'SEM-4', unidadAcademica: 'Facultad de Ingeniería', tipoUnidad: 'FACULTAD' as const, participantes: 6, actividadesRealizadas: 2, sesiones: 4, porcentajeAsistencia: 87.5, estado: 'ACTIVO' as const }],
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
  vi.mocked(escucharEventosReportes).mockReturnValue(new Promise(() => {}));
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
    expect(screen.getByRole('progressbar', { name: 'Asistencia a actividades' })).toHaveAttribute('aria-valuenow', '90');
    expect(screen.getByRole('progressbar', { name: 'Asistencia de Robótica' })).toHaveAttribute('aria-valuenow', '87.5');
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

describe('ReportsPage - exportación e impresión', () => {
  it('exporta en segundo plano con los filtros aplicados y descarga el archivo (HU10)', async () => {
    let resolver: (value: { nombre: string; archivo: Blob }) => void = () => {};
    vi.mocked(exportarReporte).mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    window.history.replaceState(null, '', '/?periodo=2026');
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    expect(exportarReporte).toHaveBeenCalledWith('xlsx', { ...EMPTY_FILTERS, periodo: '2026' }, { orden: 'nombre', direccion: 'asc' }, 'tok');
    expect(screen.getByText(/Generando el archivo XLSX/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Actualizar datos' })).toBeEnabled();
    const archivo = new Blob(['x']);
    resolver({ nombre: 'reporte_sigsi_2026-09-24_1030.xlsx', archivo });
    expect(await screen.findByText('Se descargó reporte_sigsi_2026-09-24_1030.xlsx.')).toBeInTheDocument();
    expect(descargarArchivo).toHaveBeenCalledWith('reporte_sigsi_2026-09-24_1030.xlsx', archivo);
  });

  it('informa si la exportación falla', async () => {
    vi.mocked(exportarReporte).mockRejectedValue(new Error('Error 500'));
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo exportar el reporte: Error 500');
  });

  it('abre el diálogo de impresión con la fecha de impresión (HU11)', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => window.dispatchEvent(new Event('beforeprint')));
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(print).toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue('--sigsi-print-footer')).toMatch(/^"SIGSI · Universidad de Antioquia · Impreso el /);
    expect(screen.getByText(/^Impreso el /)).toBeInTheDocument();
    print.mockRestore();
  });

  it('el coordinador puede imprimir pero no exportar', async () => {
    render(<ReportsPage alcance="COORDINADOR" token="tok" onBack={() => {}} />);
    await screen.findByRole('rowheader', { name: /Robótica/ });
    expect(screen.queryByRole('button', { name: 'Exportar Excel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument();
    expect(getRendimiento).toHaveBeenCalledWith('COORDINADOR', EMPTY_FILTERS, 0, expect.anything(), 'tok', expect.any(AbortSignal));
  });
});

describe('ReportsPage - actualización en tiempo real (HU13)', () => {
  it('recarga el tablero y muestra un aviso cuando el servidor informa cambios', async () => {
    let emitir: (evento: { evento: string; datos: string }) => void = () => {};
    vi.mocked(escucharEventosReportes).mockImplementation((_token, onEvento) => { emitir = onEvento; return new Promise(() => {}); });
    renderAdmin();
    await screen.findByRole('rowheader', { name: /Robótica/ });
    expect(escucharEventosReportes).toHaveBeenCalledWith('tok', expect.any(Function), expect.any(AbortSignal));
    act(() => emitir({ evento: 'conectado', datos: '{}' }));
    expect(screen.getByText('Actualización automática activa')).toBeInTheDocument();
    vi.mocked(getDashboard).mockResolvedValue({ ...dashboard, kpis: { ...dashboard.kpis, semillerosActivos: 8 } });
    act(() => emitir({ evento: 'datos-actualizados', datos: '{}' }));
    expect(await within(screen.getByRole('region', { name: 'Indicadores clave' })).findByText('8')).toBeInTheDocument();
    expect(screen.getByText('Los datos han sido actualizados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Los datos han sido actualizados')).not.toBeInTheDocument();
  });

  it('informa si no puede conectarse sin perder los datos mostrados (RN48)', async () => {
    vi.mocked(escucharEventosReportes).mockRejectedValue(new Error('Error 503'));
    renderAdmin();
    expect(await screen.findByText(/No se pudo verificar si hay datos nuevos/)).toBeInTheDocument();
    expect(await within(screen.getByRole('region', { name: 'Indicadores clave' })).findByText('7')).toBeInTheDocument();
  });

  it('no abre la conexión para coordinadores ni para el público', async () => {
    render(<ReportsPage alcance="COORDINADOR" token="tok" onBack={() => {}} />);
    await screen.findByRole('rowheader', { name: /Robótica/ });
    expect(escucharEventosReportes).not.toHaveBeenCalled();
    expect(screen.queryByText(/Actualización automática/)).not.toBeInTheDocument();
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
