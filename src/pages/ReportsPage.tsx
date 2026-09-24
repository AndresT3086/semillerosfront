import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { getCampus, getUnidades } from '../api/semillerosApi';
import {
  descargarArchivo, exportarReporte, getDashboard, getRendimiento, getSemillerosReporte,
  type AlcanceReporte, type FormatoExportacion, type OrdenTabla, type ReporteDashboard, type ReporteOpcion, type ReporteRendimiento,
} from '../api/reportesApi';
import type { FiltroItem, PageResponse } from '../types';
import { EMPTY_FILTERS, readReportFilters, writeReportFilters, type ReportFilters } from '../reports/filters';
import { useEventosReportes } from '../reports/useEventosReportes';
import KpiCards from '../components/reportes/KpiCards';
import UnitDistribution from '../components/reportes/UnitDistribution';
import CampusDistribution from '../components/reportes/CampusDistribution';
import MemberComposition from '../components/reportes/MemberComposition';
import TopFacultades from '../components/reportes/TopFacultades';
import EvolutionChart from '../components/reportes/EvolutionChart';
import ActivitiesByType from '../components/reportes/ActivitiesByType';
import AttendanceSummary from '../components/reportes/AttendanceSummary';
import RendimientoTable from '../components/reportes/RendimientoTable';
import { NOMBRE_TIPO } from '../components/reportes/formato';
import DetailsModal from '../components/DetailsModal';
import Footer from '../components/Footer';
import '../styles/admin.css';
import '../styles/reports.css';

const FORMATOS: { formato: FormatoExportacion; etiqueta: string; icono: string }[] = [
  { formato: 'xlsx', etiqueta: 'Exportar Excel', icono: 'file-earmark-spreadsheet' },
  { formato: 'pdf', etiqueta: 'Exportar PDF', icono: 'file-earmark-pdf' },
  { formato: 'csv', etiqueta: 'Exportar CSV', icono: 'filetype-csv' },
];

const TITULOS: Record<AlcanceReporte, { badge: string; descripcion: string }> = {
  ADMIN: { badge: 'REPORTES Y ESTADÍSTICAS', descripcion: 'Indicadores globales del programa de semilleros de investigación.' },
  COORDINADOR: { badge: 'REPORTES DE MIS SEMILLEROS', descripcion: 'Indicadores calculados solo con los semilleros que coordinas.' },
};

// HU1-HU14: tablero de reportes. HU12: el administrador ve todo y el coordinador solo sus semilleros.
export default function ReportsPage({ alcance, token, correo, onBack, onLogout }: {
  alcance: AlcanceReporte; token: string; correo?: string; onBack: () => void; onLogout?: () => void;
}) {
  const [filters, setFilters] = useState(readReportFilters);
  const [applied, setApplied] = useState(readReportFilters);
  const [revision, setRevision] = useState(0);
  const [dashboard, setDashboard] = useState<ReporteDashboard | null>(null);
  // Cada respuesta guarda la clave de la consulta que la produjo: si no coincide con la actual, está cargando.
  const [dashboardEstado, setDashboardEstado] = useState<{ clave: string; error: boolean } | null>(null);
  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [campus, setCampus] = useState<FiltroItem[]>([]);
  const [filtrosEstado, setFiltrosEstado] = useState<{ revision: number; error: boolean } | null>(null);
  const [semilleros, setSemilleros] = useState<ReporteOpcion[]>([]);
  const [tabla, setTabla] = useState<PageResponse<ReporteRendimiento> | null>(null);
  const [tablaEstado, setTablaEstado] = useState<{ clave: string; error: boolean } | null>(null);
  const [pagina, setPagina] = useState(0);
  const [orden, setOrden] = useState<OrdenTabla>({ orden: 'nombre', direccion: 'asc' });
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);
  const [exportResultado, setExportResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [impresoEn, setImpresoEn] = useState<Date | null>(null);
  const [avisoActualizado, setAvisoActualizado] = useState(false);
  const enVivo = useEventosReportes(token, alcance === 'ADMIN', () => {
    setRevision(value => value + 1);
    setAvisoActualizado(true);
  });

  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i);
  const dirty = JSON.stringify(filters) !== JSON.stringify(applied);
  const claveDashboard = JSON.stringify([alcance, applied, token, revision]);
  const loading = dashboardEstado?.clave !== claveDashboard;
  const error = !loading && dashboardEstado?.error;
  const claveTabla = JSON.stringify([claveDashboard, pagina, orden]);
  const tablaError = tablaEstado?.clave === claveTabla && tablaEstado.error;
  const filterError = filtrosEstado?.revision === revision && filtrosEstado.error;

  // Se conservan los datos anteriores mientras se actualiza y si la actualización falla (RN48).
  useEffect(() => {
    const controller = new AbortController();
    getDashboard(alcance, applied, token, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setDashboard(result);
        setUpdatedAt(new Date());
        setDashboardEstado({ clave: claveDashboard, error: false });
      })
      .catch(() => { if (!controller.signal.aborted) setDashboardEstado({ clave: claveDashboard, error: true }); });
    return () => controller.abort();
  }, [alcance, applied, token, claveDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    getRendimiento(alcance, applied, pagina, orden, token, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setTabla(result); setTablaEstado({ clave: claveTabla, error: false }); } })
      .catch(() => { if (!controller.signal.aborted) setTablaEstado({ clave: claveTabla, error: true }); });
    return () => controller.abort();
  }, [alcance, applied, pagina, orden, token, claveTabla]);

  useEffect(() => {
    let active = true;
    Promise.all([getUnidades(), getCampus()])
      .then(([units, sites]) => { if (active) { setUnidades(units); setCampus(sites); setFiltrosEstado({ revision, error: false }); } })
      .catch(() => { if (active) setFiltrosEstado({ revision, error: true }); });
    return () => { active = false; };
  }, [revision]);

  // RN49: la lista de semilleros depende de los demás filtros seleccionados.
  const { periodo, tipoUnidad, idUnidad, idCampus } = filters;
  useEffect(() => {
    const controller = new AbortController();
    getSemillerosReporte(alcance, { ...EMPTY_FILTERS, periodo, tipoUnidad, idUnidad, idCampus }, token, controller.signal)
      .then(result => { if (!controller.signal.aborted) setSemilleros(result); })
      .catch(() => { if (!controller.signal.aborted) setSemilleros([]); });
    return () => controller.abort();
  }, [alcance, token, periodo, tipoUnidad, idUnidad, idCampus, revision]);

  useEffect(() => { writeReportFilters(applied); }, [applied]);

  useEffect(() => {
    if (!avisoActualizado) return undefined;
    const temporizador = window.setTimeout(() => setAvisoActualizado(false), 6_000);
    return () => window.clearTimeout(temporizador);
  }, [avisoActualizado, revision]);

  // HU11: la fecha de impresión se fija justo antes de abrir el diálogo (también con Ctrl+P).
  useEffect(() => {
    const antesDeImprimir = () => {
      const ahora = new Date();
      flushSync(() => setImpresoEn(ahora));
      document.documentElement.style.setProperty('--sigsi-print-footer',
        `"SIGSI · Universidad de Antioquia · Impreso el ${ahora.toLocaleString('es-CO')}"`);
    };
    window.addEventListener('beforeprint', antesDeImprimir);
    return () => {
      window.removeEventListener('beforeprint', antesDeImprimir);
      document.documentElement.style.removeProperty('--sigsi-print-footer');
    };
  }, []);

  // HU10/RN38: la exportación corre en segundo plano; la página sigue disponible mientras se genera.
  function exportar(formato: FormatoExportacion) {
    setExportando(formato);
    setExportResultado(null);
    exportarReporte(formato, applied, orden, token)
      .then(({ nombre, archivo }) => {
        descargarArchivo(nombre, archivo);
        setExportResultado({ ok: true, texto: `Se descargó ${nombre}.` });
      })
      .catch((err: Error) => setExportResultado({ ok: false, texto: `No se pudo exportar el reporte: ${err.message}` }))
      .finally(() => setExportando(null));
  }

  function aplicar(next: ReportFilters) {
    setFilters(next);
    setApplied(next);
    setPagina(0);
  }

  // Los clics en los gráficos filtran el reporte completo y la tabla (HU3, HU4, RN23).
  function filtrarDesdeGrafico(parcial: Partial<ReportFilters>) {
    aplicar({ ...applied, ...parcial, idSemillero: '' });
  }

  const nombreUnidad = unidades.find(item => String(item.id) === applied.idUnidad)?.nombre ?? (applied.idUnidad ? `Unidad #${applied.idUnidad}` : 'Todas las unidades');
  const nombreCampus = campus.find(item => String(item.id) === applied.idCampus)?.nombre ?? (applied.idCampus ? `Campus #${applied.idCampus}` : 'Todos los campus');
  const nombreSemillero = semilleros.find(item => String(item.id) === applied.idSemillero)?.nombre ?? (applied.idSemillero ? `Semillero #${applied.idSemillero}` : 'Todos los semilleros');
  const resumenFiltros = [applied.periodo || 'Estado actual', applied.tipoUnidad ? NOMBRE_TIPO[applied.tipoUnidad as keyof typeof NOMBRE_TIPO] : 'Todos los tipos', nombreUnidad, nombreCampus, nombreSemillero].join(' · ');
  const sinDatos = dashboard !== null && dashboard.kpis.semillerosActivos === 0;

  return <div className="admin-dashboard report-page">
    <header className="udea-header"><div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div><div className="udea-logo mb-1">UdeA <span>SEMILLEROS</span></div><div className="system-title">Sistema de Gestión de Semilleros · SIGSI</div><span className="sigsi-badge">{TITULOS[alcance].badge}</span></div>
      <div className="d-flex gap-2 flex-wrap align-items-center no-print">
        {correo && <span className="text-white small me-2">{correo}</span>}
        <button className="btn btn-outline-light" onClick={onBack}>← Volver al panel</button>
        {onLogout && <button className="btn btn-outline-light" onClick={onLogout}>Cerrar sesión</button>}
      </div>
    </div></header>
    <main className="container admin-main">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">INDICADORES DEL PROGRAMA</p><h1>Reportes y estadísticas</h1><p className="text-muted mb-0">{TITULOS[alcance].descripcion}</p></div>
        <div className="d-flex flex-wrap gap-2 no-print">
          <button className="btn admin-outline" disabled={loading} onClick={() => setRevision(value => value + 1)}><i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />{loading ? 'Actualizando…' : 'Actualizar datos'}</button>
          {alcance === 'ADMIN' && FORMATOS.map(({ formato, etiqueta, icono }) => <button key={formato} className="btn admin-outline" disabled={exportando !== null} onClick={() => exportar(formato)}>
            {exportando === formato ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : <i className={`bi bi-${icono} me-2`} aria-hidden="true" />}{etiqueta}
          </button>)}
          <button className="btn btn-udea mt-0" onClick={() => window.print()}><i className="bi bi-printer me-2" aria-hidden="true" />Imprimir</button>
        </div>
      </div>
      {exportando && <p className="report-status no-print" role="status">Generando el archivo {exportando.toUpperCase()} con los filtros aplicados. Puedes seguir consultando el reporte.</p>}
      {exportResultado && <div className={`alert ${exportResultado.ok ? 'alert-success' : 'alert-danger'} no-print`} role={exportResultado.ok ? 'status' : 'alert'}>{exportResultado.texto}</div>}
      <div className="print-only report-print-heading">
        <strong>Reporte de semilleros de investigación · Universidad de Antioquia</strong>
        <span>Impreso el {(impresoEn ?? new Date()).toLocaleString('es-CO')}</span>
      </div>

      <section className="admin-card no-print" aria-labelledby="report-filters"><div className="admin-section-heading"><h2 id="report-filters"><i className="bi bi-funnel" aria-hidden="true" />Filtrar información</h2><span className="admin-badge">{applied.periodo || 'Estado actual'}</span></div>
        <form className="row g-3 align-items-end" onSubmit={event => { event.preventDefault(); aplicar({ ...filters }); }}>
          <div className="col-md-4"><label htmlFor="report-period" className="form-label">Período académico</label><select id="report-period" className="form-select" value={filters.periodo} onChange={event => setFilters(value => ({ ...value, periodo: event.target.value, idSemillero: '' }))}><option value="">Estado actual (sin período)</option>{years.map(year => <optgroup key={year} label={String(year)}><option value={year}>{year} · Año completo</option><option value={`${year}-1`}>{year}-1 · Primer semestre</option><option value={`${year}-2`}>{year}-2 · Segundo semestre</option></optgroup>)}</select></div>
          <div className="col-md-4"><label htmlFor="report-type" className="form-label">Tipo de unidad</label><select id="report-type" className="form-select" value={filters.tipoUnidad} onChange={event => setFilters(value => ({ ...value, tipoUnidad: event.target.value, idUnidad: '', idSemillero: '' }))}><option value="">Todas las unidades</option><option value="FACULTAD">Facultades</option><option value="ESCUELA">Escuelas</option><option value="INSTITUTO">Institutos</option><option value="CORPORACION">Corporaciones</option><option value="SECCIONAL">Seccionales</option></select></div>
          <div className="col-md-4"><label htmlFor="report-unit" className="form-label">Unidad académica</label><select id="report-unit" className="form-select" value={filters.idUnidad} onChange={event => setFilters(value => ({ ...value, idUnidad: event.target.value, idSemillero: '' }))} disabled={filterError}><option value="">Todas las unidades académicas</option>{unidades.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <div className="col-md-4"><label htmlFor="report-campus" className="form-label">Campus o seccional</label><select id="report-campus" className="form-select" value={filters.idCampus} disabled={filterError} onChange={event => setFilters(value => ({ ...value, idCampus: event.target.value, idSemillero: '' }))}><option value="">Todos los campus</option>{campus.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <div className="col-md-4"><label htmlFor="report-semillero" className="form-label">Semillero</label><select id="report-semillero" className="form-select" value={filters.idSemillero} onChange={event => setFilters(value => ({ ...value, idSemillero: event.target.value }))}><option value="">Todos los semilleros</option>{filters.idSemillero && !semilleros.some(item => String(item.id) === filters.idSemillero) && <option value={filters.idSemillero}>Semillero seleccionado #{filters.idSemillero}</option>}{semilleros.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><small className="text-muted">Semilleros activos que cumplen los demás filtros.</small></div>
          <div className="col-md-4 d-flex gap-2"><button className="btn btn-udea mt-0" disabled={loading}>Aplicar filtros</button><button type="button" className="btn admin-outline" onClick={() => aplicar({ ...EMPTY_FILTERS })}>Limpiar</button></div>
        </form>
        {dirty && <p role="status" className="mt-3 mb-0">Hay cambios sin aplicar. Los resultados conservan los filtros anteriores.</p>}
        {filterError && <p className="text-danger mt-3 mb-0" role="alert">No se cargaron todos los filtros. Pulsa «Actualizar datos» para reintentar.</p>}
      </section>

      {enVivo !== 'inactivo' && <p className={`report-live no-print is-${enVivo}`}><span className="report-live-dot" aria-hidden="true" />{enVivo === 'conectado' ? 'Actualización automática activa' : enVivo === 'error' ? 'Sin conexión para actualizaciones automáticas' : 'Conectando actualizaciones automáticas…'}</p>}
      {enVivo === 'error' && <div className="alert alert-warning no-print" role="alert">No se pudo verificar si hay datos nuevos. Los datos mostrados se conservan y se reintentará automáticamente.</div>}
      {avisoActualizado && <div className="report-live-toast no-print" role="status"><i className="bi bi-arrow-repeat me-2" aria-hidden="true" />Los datos han sido actualizados<button type="button" className="btn-close btn-close-white ms-3" aria-label="Cerrar aviso" onClick={() => setAvisoActualizado(false)} /></div>}
      <div className="report-status" role="status">{loading ? 'Consultando la información más reciente…' : updatedAt ? `Última consulta: ${updatedAt.toLocaleString('es-CO')}` : 'Sin consulta disponible'}</div>
      <p className="small report-applied">Filtros aplicados: {resumenFiltros}</p>
      {error && <div className="alert alert-danger no-print" role="alert">No pudimos consultar los indicadores. Los datos mostrados pueden no estar actualizados.<button className="btn btn-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      {sinDatos && <div className="alert alert-warning" role="status">No hay semilleros activos para los filtros seleccionados. Prueba con otro período, unidad o campus.</div>}

      <KpiCards kpis={dashboard?.kpis ?? null} loading={loading && !dashboard} />
      {dashboard && <>
        <UnitDistribution rows={dashboard.porUnidad} selectedId={applied.idUnidad} onSelect={idUnidad => filtrarDesdeGrafico({ idUnidad })} />
        <CampusDistribution rows={dashboard.porCampus} selectedId={applied.idCampus} onSelect={idCampus => filtrarDesdeGrafico({ idCampus })} />
        <MemberComposition sexo={dashboard.porSexo} roles={dashboard.porRol} />
        <div className="row g-4 mb-4">
          <div className="col-lg-5"><TopFacultades rows={dashboard.topFacultades} selectedId={applied.idUnidad} onSelect={idUnidad => filtrarDesdeGrafico({ idUnidad })} /></div>
          <div className="col-lg-7"><EvolutionChart puntos={dashboard.evolucion} /></div>
        </div>
        <ActivitiesByType rows={dashboard.actividadesPorTipo} />
        <AttendanceSummary datos={dashboard.asistencia} />
      </>}

      <section className="admin-card report-table-card" aria-labelledby="report-detail"><div className="admin-section-heading"><h2 id="report-detail"><i className="bi bi-table" aria-hidden="true" />Rendimiento por semillero</h2><span className="admin-badge">Activos e inactivos</span></div>
        {tablaError ? <div className="alert alert-warning" role="alert">No se pudo cargar la tabla de rendimiento.<button className="btn btn-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>
          : !tabla ? <p role="status">Cargando tabla…</p>
            : !tabla.contenido.length ? <p>No se encontraron semilleros para los filtros aplicados.</p>
              : <RendimientoTable page={tabla} orden={orden} onOrden={next => { setOrden(next); setPagina(0); }} onPagina={setPagina} onAbrir={setDetalleId} />}
        <p className="text-muted small mt-3 mb-0">Actividades y asistencia registradas por los coordinadores en el período. % asistencia = presentes / (presentes + ausentes); las ausencias excusadas se descuentan.</p>
      </section>
    </main>
    <div className="no-print"><Footer /></div>
    <DetailsModal semilleroId={detalleId} isOpen={detalleId !== null} onClose={() => setDetalleId(null)} />
  </div>;
}
