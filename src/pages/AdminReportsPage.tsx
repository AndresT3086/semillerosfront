import { useEffect, useId, useState } from 'react';
import { getReportesDisponibles, getUnidades, getCatalogoReportes, getReporteSemillero, getCampus, getKpisAdministrativos, type KpisAdministrativos } from '../api/semillerosApi';
import type { FiltroItem, PageResponse, SemilleroResumen } from '../types';
import { EMPTY_FILTERS, REPORT_FILTERS_KEY, readReportFilters } from '../reports/filters';
import MemberComposition from '../components/reportes/MemberComposition';
import CampusDistribution from '../components/reportes/CampusDistribution';
import UnitDistribution from '../components/reportes/UnitDistribution';
import Footer from '../components/Footer';
import '../styles/admin.css';
import '../styles/reports.css';

function KpiCard({ label, icon, value, note, loading, percentage = false }: {
  label: string; icon: string; value: number | null; note: string; loading: boolean; percentage?: boolean;
}) {
  const tooltipId = useId();
  return <article className="admin-stat report-kpi" tabIndex={0} aria-describedby={tooltipId}>
    <span className="admin-stat-icon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
    <div className="admin-stat-value">{loading ? '…' : value === null ? '—' : `${value.toLocaleString('es-CO')} ${percentage ? '%' : ''}`}</div>
    <h2>{label}</h2><p>{note}</p>
    <div className="report-trend"><i className="bi bi-info-circle me-1" aria-hidden="true" />Tendencia no disponible</div>
    <span className="report-tooltip" role="tooltip" id={tooltipId}>No hay datos del período anterior para calcular la variación porcentual.</span>
  </article>;
}

export default function AdminReportsPage({ preview = false, token, onBack, onLogout }: {
  preview?: boolean; token?: string; onBack: () => void; onLogout: () => void;
}) {
  const [kpis, setKpis] = useState<KpisAdministrativos | null>(null);
  const [kpiError, setKpiError] = useState(false);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [data, setData] = useState<PageResponse<SemilleroResumen> | null>(null);
  const [campus, setCampus] = useState<FiltroItem[]>([]);
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
    setKpis(null); setKpiError(false); setKpiLoading(false);
    if (!token || unsupported) return;
    setKpiLoading(true);
    getKpisAdministrativos(token, applied).then(result => { if (active) setKpis(result); })
      .catch(() => { if (active) setKpiError(true); })
      .finally(() => { if (active) setKpiLoading(false); });
    return () => { active = false; };
  }, [token, applied, unsupported, revision]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    setUpdatedAt(null);
    if (unsupported) { setLoading(false); return; }
    const request = applied.idSemillero
      ? getReporteSemillero(applied.idSemillero)
      : getReportesDisponibles(applied.idUnidad, pagina, applied.idCampus);
    request
      .then(result => { if (active) { setData(result); setUpdatedAt(new Date()); } })
      .catch(() => { if (active) setError('No pudimos consultar los indicadores. Revisa la conexión y vuelve a intentarlo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, pagina, revision, unsupported]);

  useEffect(() => {
    let active = true;
    setFilterError(false);
    Promise.all([getUnidades(), getCampus()]).then(([units, sites]) => { if (active) { setUnidades(units); setCampus(sites); } })
      .catch(() => { if (active) setFilterError(true); });
    return () => { active = false; };
  }, [revision]);


  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError(false);
    setCatalogo([]);
    getCatalogoReportes(filters.idUnidad, filters.idCampus)
      .then(items => { if (active) setCatalogo(items); })
      .catch(() => { if (active) setCatalogError(true); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [filters.idUnidad, filters.idCampus, revision]);

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
          <div className="col-md-4"><label htmlFor="report-campus" className="form-label">Campus o seccional</label><select id="report-campus" className="form-select" value={filters.idCampus} disabled={filterError} onChange={event => setFilters(value => ({ ...value, idCampus: event.target.value, idSemillero: '' }))}><option value="">Todos los campus</option>{campus.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
          <div className="col-md-8"><label htmlFor="report-semillero" className="form-label">Semillero</label><select id="report-semillero" className="form-select" value={filters.idSemillero} disabled={catalogLoading || catalogError} onChange={event => setFilters(value => ({ ...value, idSemillero: event.target.value }))}><option value="">Todos los semilleros del catálogo público</option>{filters.idSemillero && !catalogo.some(item => String(item.id) === filters.idSemillero) && <option value={filters.idSemillero}>Semillero seleccionado #{filters.idSemillero}</option>}{catalogo.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><small className="text-muted">{catalogLoading ? 'Cargando catálogo…' : 'Semilleros activos con caracterización completa.'}</small></div>
          <div className="col-md-4 d-flex gap-2"><button className="btn btn-udea mt-0" disabled={loading}>Aplicar filtros</button><button type="button" className="btn admin-outline" onClick={() => { setFilters({ ...EMPTY_FILTERS }); setApplied({ ...EMPTY_FILTERS }); setPagina(0); setRevision(value => value + 1); }}>Limpiar</button></div>
        </form>
        <p className="text-muted small mt-3 mb-0">Los períodos y tipos de unidad pueden seleccionarse, pero su consulta aún no está disponible. Al aplicarlos no se mostrarán cifras sin filtrar.</p>
        {dirty && <p role="status" className="mt-2 mb-0">Hay cambios sin aplicar. Los resultados conservan los filtros anteriores.</p>}
        {(filterError || catalogError) && <p className="text-danger mt-3 mb-0" role="alert">No se cargaron todos los filtros. Pulsa «Actualizar datos» para reintentar.</p>}

      </section>
      <div className="report-status" role="status">{loading ? 'Consultando la información más reciente…' : updatedAt ? `Última consulta: ${updatedAt.toLocaleString('es-CO')}` : 'Sin consulta disponible'}</div>
      <p className="small">Filtros aplicados: {applied.periodo || 'Estado actual'} · {applied.tipoUnidad || 'Todos los tipos'} · {applied.idUnidad ? unidades.find(item => String(item.id) === applied.idUnidad)?.nombre ?? `Unidad #${applied.idUnidad}` : 'Todas las unidades'} · {campus.find(item => String(item.id) === applied.idCampus)?.nombre ?? (applied.idCampus ? `Campus #${applied.idCampus}` : 'Todos los campus')} · {applied.idSemillero ? `Semillero #${applied.idSemillero}` : 'Todos los semilleros'}</p>
      {unsupported && <div className="alert alert-warning" role="status">Consulta no disponible para {applied.periodo ? `el período ${applied.periodo}` : 'el tipo de unidad seleccionado'}. Falta habilitar estos filtros en el servicio de reportes. No se han usado datos del estado actual como resultados de esta selección.</div>}
      {error && <div className="alert alert-danger" role="alert">{error}<button className="btn btn-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      {kpiError && <div role="alert" className="alert alert-warning">No se pudieron consultar los KPI administrativos. Pulsa «Actualizar datos» para reintentar.</div>}
      {token && <p className="small text-muted">KPI sobre semilleros activos: personas únicas por cédula y eventos realizados hasta hoy. La tabla inferior todavía corresponde al catálogo público, que exige caracterización completa.</p>}
      <section className="row g-3 mb-4" aria-label="Indicadores clave" aria-busy={loading}>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Semilleros activos" icon="tree" value={token ? kpis?.semillerosActivos ?? null : data?.totalElementos ?? null} note={token ? "Todos los activos de la selección." : applied.idSemillero ? "Estado actual del semillero seleccionado." : "Activos con caracterización completa; conteo parcial."} loading={token ? kpiLoading : loading} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Usuarios registrados" icon="people" value={kpis?.usuariosRegistrados ?? null} note={token ? "Personas únicas por cédula entre integrantes." : "Total de usuarios aún no disponible."} loading={kpiLoading} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Actividades realizadas" icon="calendar-check" value={kpis?.actividadesRealizadas ?? null} note={token ? "Eventos fechados realizados hasta hoy." : "Total institucional aún no disponible."} loading={kpiLoading} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Tasa de participación" icon="pie-chart" value={kpis?.tasaParticipacion ?? null} percentage note="Personas activas / registradas × 100." loading={kpiLoading} /></div>
      </section>
      <p className="report-availability"><i className="bi bi-info-circle me-2" aria-hidden="true" />«—» indica información no disponible, no un valor de cero. Las comparaciones estarán disponibles cuando existan datos del período anterior.</p>
      <UnitDistribution idCampus={applied.idCampus} revision={revision} selectedId={applied.idUnidad} unsupported={unsupported} selectedSemillero={Boolean(applied.idSemillero)} onSelect={idUnidad => {
        const next = { ...applied, idUnidad, idSemillero: '' };
        setFilters(next);
        setApplied(next);
        setPagina(0);
      }} />
      <CampusDistribution idUnidad={applied.idUnidad} selectedId={applied.idCampus} revision={revision} blocked={unsupported || Boolean(applied.idSemillero)} onSelect={idCampus => {
        const next = { ...applied, idCampus, idSemillero: '' };
        setFilters(next); setApplied(next); setPagina(0);
      }} />
      <MemberComposition filters={applied} />
      <section className="admin-card" aria-labelledby="report-detail"><div className="admin-section-heading"><h2 id="report-detail"><i className="bi bi-table" aria-hidden="true" />Detalle disponible por semillero</h2><span className="admin-badge">Catálogo activo</span></div><p className="text-muted small">Las actividades son las registradas como realizadas en cada semillero, sin filtro de período. No equivalen al total institucional ni al número de eventos de un mes.</p>
        {loading ? <p role="status">Cargando detalle…</p> : error ? <p>No hay detalle disponible en esta consulta.</p> : unsupported ? <p>Selecciona «Estado actual» y «Todas las unidades» para consultar los datos disponibles.</p> : !data?.contenido.length ? <p>No se encontraron semilleros activos para esta selección.</p> : <><div className="table-responsive"><table className="table report-table"><caption>Resultados para {unidades.find(item => String(item.id) === applied.idUnidad)?.nombre ?? 'todas las unidades'}</caption><thead><tr><th scope="col">Semillero</th><th scope="col">Unidad académica</th><th scope="col">Campus</th><th scope="col">Actividades realizadas</th></tr></thead><tbody>{data.contenido.map(item => <tr key={item.id}><th scope="row">{item.nombre}</th><td>{item.facultad}</td><td>{item.campus}</td><td>{item.totalActividadesCientificas ?? '—'}</td></tr>)}</tbody></table></div><nav className="admin-pagination" aria-label="Paginación de reportes"><button className="btn admin-outline" disabled={data.esPrimeraPagina} onClick={() => setPagina(value => value - 1)}>Anterior</button><span>Página {data.paginaActual + 1} de {data.totalPaginas}</span><button className="btn admin-outline" disabled={data.esUltimaPagina} onClick={() => setPagina(value => value + 1)}>Siguiente</button></nav></>}
      </section>
    </main><Footer />
  </div>;
}
