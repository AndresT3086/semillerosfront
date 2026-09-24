import { useEffect, useId, useState } from 'react';
import { getReportesDisponibles, getUnidades, getCatalogoReportes, getReporteSemillero } from '../api/semillerosApi';
import type { FiltroItem, PageResponse, SemilleroResumen } from '../types';
import { EMPTY_FILTERS, REPORT_FILTERS_KEY, readReportFilters } from '../reports/filters';
import Footer from '../components/Footer';
import '../styles/admin.css';
import '../styles/reports.css';

function KpiCard({ label, icon, value, note, loading }: {
  label: string; icon: string; value: number | null; note: string; loading: boolean;
}) {
  const tooltipId = useId();
  return <article className="admin-stat report-kpi" tabIndex={0} aria-describedby={tooltipId}>
    <span className="admin-stat-icon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
    <div className="admin-stat-value">{loading ? '…' : value === null ? '—' : value.toLocaleString('es-CO')}</div>
    <h2>{label}</h2><p>{note}</p>
    <div className="report-trend"><i className="bi bi-info-circle me-1" aria-hidden="true" />Tendencia no disponible</div>
    <span className="report-tooltip" role="tooltip" id={tooltipId}>No hay datos del período anterior para calcular la variación porcentual.</span>
  </article>;
}

export default function AdminReportsPage({ preview = false, onBack, onLogout }: {
  preview?: boolean; onBack: () => void; onLogout: () => void;
}) {
  const [data, setData] = useState<PageResponse<SemilleroResumen> | null>(null);
  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [filters, setFilters] = useState(readReportFilters);
  const [applied, setApplied] = useState(readReportFilters);
  const [catalogo, setCatalogo] = useState<SemilleroResumen[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const unsupported = Boolean(applied.periodo || applied.tipoUnidad);
  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i);
  if (filters.periodo && !years.includes(Number(filters.periodo.slice(0, 4)))) years.push(Number(filters.periodo.slice(0, 4)));
  const dirty = JSON.stringify(filters) !== JSON.stringify(applied);
  const [pagina, setPagina] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    setUpdatedAt(null);
    if (unsupported) { setLoading(false); return; }
    const request = applied.idSemillero
      ? getReporteSemillero(applied.idSemillero)
      : getReportesDisponibles(applied.idUnidad, pagina);
    request
      .then(result => { if (active) { setData(result); setUpdatedAt(new Date()); } })
      .catch(() => { if (active) setError('No pudimos consultar los indicadores. Revisa la conexión y vuelve a intentarlo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, pagina, revision, unsupported]);

  useEffect(() => {
    let active = true;
    setFilterError(false);
    getUnidades().then(result => { if (active) setUnidades(result); })
      .catch(() => { if (active) setFilterError(true); });
    return () => { active = false; };
  }, [revision]);


  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError(false);
    setCatalogo([]);
    getCatalogoReportes(filters.idUnidad)
      .then(items => { if (active) setCatalogo(items); })
      .catch(() => { if (active) setCatalogError(true); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [filters.idUnidad, revision]);

  useEffect(() => {
    try { sessionStorage.setItem(REPORT_FILTERS_KEY, JSON.stringify(applied)); } catch { /* Storage unavailable: page remains usable. */ }
  }, [applied]);

  return <div className="admin-dashboard">
    <header className="udea-header"><div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div><div className="udea-logo mb-1">UdeA <span>SEMILLEROS</span></div><div className="system-title">Sistema de Gestión de Semilleros · SIGSI</div><span className="sigsi-badge">REPORTES Y ESTADÍSTICAS</span></div>
      <div className="d-flex gap-2 flex-wrap"><button className="btn btn-outline-light" onClick={onBack}>← Volver al panel</button><button className="btn btn-outline-light" onClick={onLogout}>{preview ? 'Volver al portal' : 'Cerrar sesión'}</button></div>
    </div></header>
    <main className="container admin-main">
      {preview && <div className="admin-preview">Vista previa local · Consulta de información pública. El acceso administrativo está pendiente de habilitación.</div>}
      <div className="admin-page-heading"><div><p className="admin-eyebrow">INDICADORES DEL PROGRAMA</p><h1>Reportes y estadísticas</h1><p className="text-muted mb-0">Consulta el estado actual de los semilleros de investigación.</p></div><button className="btn admin-outline" disabled={loading} onClick={() => setRevision(value => value + 1)}><i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />{loading ? 'Actualizando…' : 'Actualizar datos'}</button></div>
      <section className="admin-card" aria-labelledby="report-filters"><div className="admin-section-heading"><h2 id="report-filters"><i className="bi bi-funnel" aria-hidden="true" />Filtrar información</h2><span className="admin-badge">{applied.periodo || 'Estado actual'}</span></div>
        <form className="row g-3 align-items-end" onSubmit={event => { event.preventDefault(); setPagina(0); setApplied({ ...filters }); setRevision(value => value + 1); }}>
          <div className="col-md-4"><label htmlFor="report-period" className="form-label">Período académico</label><select id="report-period" className="form-select" value={filters.periodo} onChange={event => setFilters(value => ({ ...value, periodo: event.target.value }))}><option value="">Estado actual (sin período)</option>{years.map(year => <optgroup key={year} label={String(year)}><option value={year}>{year} · Año completo</option><option value={`${year}-1`}>{year}-1 · Primer semestre</option><option value={`${year}-2`}>{year}-2 · Segundo semestre</option></optgroup>)}</select></div>
          <div className="col-md-4"><label htmlFor="report-type" className="form-label">Tipo de unidad</label><select id="report-type" className="form-select" value={filters.tipoUnidad} onChange={event => setFilters(value => ({ ...value, tipoUnidad: event.target.value, idUnidad: '', idSemillero: '' }))}><option value="">Todas las unidades</option><option value="FACULTAD">Facultades</option><option value="ESCUELA">Escuelas</option><option value="INSTITUTO">Institutos</option><option value="CORPORACION">Corporaciones</option></select></div>
          <div className="col-md-4"><label htmlFor="report-unit" className="form-label">Unidad académica</label><select id="report-unit" className="form-select" value={filters.idUnidad} onChange={event => setFilters(value => ({ ...value, idUnidad: event.target.value, idSemillero: '' }))} disabled={filterError || Boolean(filters.tipoUnidad)}><option value="">Todas las unidades académicas</option>{unidades.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <div className="col-md-8"><label htmlFor="report-semillero" className="form-label">Semillero</label><select id="report-semillero" className="form-select" value={filters.idSemillero} disabled={catalogLoading || catalogError} onChange={event => setFilters(value => ({ ...value, idSemillero: event.target.value }))}><option value="">Todos los semilleros del catálogo público</option>{filters.idSemillero && !catalogo.some(item => String(item.id) === filters.idSemillero) && <option value={filters.idSemillero}>Semillero seleccionado #{filters.idSemillero}</option>}{catalogo.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><small className="text-muted">{catalogLoading ? 'Cargando catálogo…' : 'Semilleros activos con caracterización completa.'}</small></div>
          <div className="col-md-4 d-flex gap-2"><button className="btn btn-udea mt-0" disabled={loading}>Aplicar filtros</button><button type="button" className="btn admin-outline" onClick={() => { setFilters({ ...EMPTY_FILTERS }); setApplied({ ...EMPTY_FILTERS }); setPagina(0); setRevision(value => value + 1); }}>Limpiar</button></div>
        </form>
        <p className="text-muted small mt-3 mb-0">Los períodos y tipos de unidad pueden seleccionarse, pero su consulta aún no está disponible. Al aplicarlos no se mostrarán cifras sin filtrar.</p>
        {dirty && <p role="status" className="mt-2 mb-0">Hay cambios sin aplicar. Los resultados conservan los filtros anteriores.</p>}
        {(filterError || catalogError) && <p className="text-danger mt-3 mb-0" role="alert">No se cargaron todos los filtros. Pulsa «Actualizar datos» para reintentar.</p>}

      </section>
      <div className="report-status" role="status">{loading ? 'Consultando la información más reciente…' : updatedAt ? `Última consulta: ${updatedAt.toLocaleString('es-CO')}` : 'Sin consulta disponible'}</div>
      <p className="small">Filtros aplicados: {applied.periodo || 'Estado actual'} · {applied.tipoUnidad || 'Todos los tipos'} · {applied.idUnidad ? unidades.find(item => String(item.id) === applied.idUnidad)?.nombre ?? `Unidad #${applied.idUnidad}` : 'Todas las unidades'} · {applied.idSemillero ? `Semillero #${applied.idSemillero}` : 'Todos los semilleros'}</p>
      {unsupported && <div className="alert alert-warning" role="status">Consulta no disponible para {applied.periodo ? `el período ${applied.periodo}` : 'el tipo de unidad seleccionado'}. Falta habilitar estos filtros en el servicio de reportes. No se han usado datos del estado actual como resultados de esta selección.</div>}
      {error && <div className="alert alert-danger" role="alert">{error}<button className="btn btn-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      <section className="row g-3 mb-4" aria-label="Indicadores clave" aria-busy={loading}>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Semilleros activos" icon="tree" value={data?.totalElementos ?? null} note={applied.idSemillero ? "Estado actual del semillero seleccionado." : "Activos con caracterización completa; conteo parcial."} loading={loading} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Usuarios registrados" icon="people" value={null} note="Total de usuarios aún no disponible." loading={false} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Actividades realizadas" icon="calendar-check" value={null} note="Total institucional aún no disponible." loading={false} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Tasa de participación" icon="pie-chart" value={null} note="Miembros activos / registrados × 100." loading={false} /></div>
      </section>
      <p className="report-availability"><i className="bi bi-info-circle me-2" aria-hidden="true" />«—» indica información no disponible, no un valor de cero. Las comparaciones estarán disponibles cuando existan datos del período anterior.</p>
      <section className="admin-card" aria-labelledby="report-detail"><div className="admin-section-heading"><h2 id="report-detail"><i className="bi bi-table" aria-hidden="true" />Detalle disponible por semillero</h2><span className="admin-badge">Catálogo activo</span></div><p className="text-muted small">Las actividades son las registradas como realizadas en cada semillero, sin filtro de período. No equivalen al total institucional ni al número de eventos de un mes.</p>
        {loading ? <p role="status">Cargando detalle…</p> : error ? <p>No hay detalle disponible en esta consulta.</p> : unsupported ? <p>Selecciona «Estado actual» y «Todas las unidades» para consultar los datos disponibles.</p> : !data?.contenido.length ? <p>No se encontraron semilleros activos para esta selección.</p> : <><div className="table-responsive"><table className="table report-table"><caption>Resultados para {unidades.find(item => String(item.id) === applied.idUnidad)?.nombre ?? 'todas las unidades'}</caption><thead><tr><th scope="col">Semillero</th><th scope="col">Unidad académica</th><th scope="col">Campus</th><th scope="col">Actividades realizadas</th></tr></thead><tbody>{data.contenido.map(item => <tr key={item.id}><th scope="row">{item.nombre}</th><td>{item.facultad}</td><td>{item.campus}</td><td>{item.totalActividadesCientificas ?? '—'}</td></tr>)}</tbody></table></div><nav className="admin-pagination" aria-label="Paginación de reportes"><button className="btn admin-outline" disabled={data.esPrimeraPagina} onClick={() => setPagina(value => value - 1)}>Anterior</button><span>Página {data.paginaActual + 1} de {data.totalPaginas}</span><button className="btn admin-outline" disabled={data.esUltimaPagina} onClick={() => setPagina(value => value + 1)}>Siguiente</button></nav></>}
      </section>
    </main><Footer />
  </div>;
}
