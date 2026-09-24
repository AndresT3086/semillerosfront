import { useEffect, useId, useState } from 'react';
import { getReportesDisponibles, getUnidades } from '../api/semillerosApi';
import type { FiltroItem, PageResponse, SemilleroResumen } from '../types';
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
  const [unidad, setUnidad] = useState('');
  const [appliedUnidad, setAppliedUnidad] = useState('');
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
    getReportesDisponibles(appliedUnidad, pagina)
      .then(result => { if (active) { setData(result); setUpdatedAt(new Date()); } })
      .catch(() => { if (active) setError('No pudimos consultar los indicadores. Revisa la conexión y vuelve a intentarlo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedUnidad, pagina, revision]);

  useEffect(() => {
    let active = true;
    setFilterError(false);
    getUnidades().then(result => { if (active) setUnidades(result); })
      .catch(() => { if (active) setFilterError(true); });
    return () => { active = false; };
  }, [revision]);

  return <div className="admin-dashboard">
    <header className="udea-header"><div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div><div className="udea-logo mb-1">UdeA <span>SEMILLEROS</span></div><div className="system-title">Sistema de Gestión de Semilleros · SIGSI</div><span className="sigsi-badge">REPORTES Y ESTADÍSTICAS</span></div>
      <div className="d-flex gap-2 flex-wrap"><button className="btn btn-outline-light" onClick={onBack}>← Volver al panel</button><button className="btn btn-outline-light" onClick={onLogout}>{preview ? 'Volver al portal' : 'Cerrar sesión'}</button></div>
    </div></header>
    <main className="container admin-main">
      {preview && <div className="admin-preview">Vista previa local · Consulta de información pública. El acceso administrativo está pendiente de habilitación.</div>}
      <div className="admin-page-heading"><div><p className="admin-eyebrow">INDICADORES DEL PROGRAMA</p><h1>Reportes y estadísticas</h1><p className="text-muted mb-0">Consulta el estado actual de los semilleros de investigación.</p></div><button className="btn admin-outline" disabled={loading} onClick={() => setRevision(value => value + 1)}><i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />{loading ? 'Actualizando…' : 'Actualizar datos'}</button></div>
      <section className="admin-card" aria-labelledby="report-filters"><div className="admin-section-heading"><h2 id="report-filters"><i className="bi bi-funnel" aria-hidden="true" />Filtrar información</h2><span className="admin-badge">Estado actual</span></div>
        <form className="row g-3 align-items-end" onSubmit={event => { event.preventDefault(); setPagina(0); setAppliedUnidad(unidad); setRevision(value => value + 1); }}>
          <div className="col-md-4"><label htmlFor="report-period" className="form-label">Período</label><select id="report-period" className="form-select" disabled aria-describedby="period-help"><option>Estado actual</option></select><small id="period-help" className="text-muted">Consulta histórica pendiente.</small></div>
          <div className="col-md-5"><label htmlFor="report-unit" className="form-label">Unidad académica</label><select id="report-unit" className="form-select" value={unidad} onChange={event => setUnidad(event.target.value)} disabled={filterError}><option value="">Todas las unidades</option>{unidades.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><small className="text-muted">Aplica al conteo y al listado de semilleros activos.</small></div>
          <div className="col-md-3"><button className="btn btn-udea w-100 mt-0" disabled={loading || filterError}>Aplicar filtros</button></div>
        </form>{filterError && <p className="text-danger mt-3 mb-0" role="alert">No se cargaron las unidades. Pulsa «Actualizar datos» para reintentar.</p>}
      </section>
      <div className="report-status" role="status">{loading ? 'Consultando la información más reciente…' : updatedAt ? `Última consulta: ${updatedAt.toLocaleString('es-CO')}` : 'Sin consulta disponible'}</div>
      {error && <div className="alert alert-danger" role="alert">{error}<button className="btn btn-link" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      <section className="row g-3 mb-4" aria-label="Indicadores clave" aria-busy={loading}>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Semilleros activos" icon="tree" value={data?.totalElementos ?? null} note="Excluye los semilleros inactivos." loading={loading} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Usuarios registrados" icon="people" value={null} note="Total de usuarios aún no disponible." loading={false} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Actividades realizadas" icon="calendar-check" value={null} note="Total institucional aún no disponible." loading={false} /></div>
        <div className="col-sm-6 col-xl-3"><KpiCard label="Tasa de participación" icon="pie-chart" value={null} note="Miembros activos / registrados × 100." loading={false} /></div>
      </section>
      <p className="report-availability"><i className="bi bi-info-circle me-2" aria-hidden="true" />«—» indica información no disponible, no un valor de cero. Las comparaciones estarán disponibles cuando existan datos del período anterior.</p>
      <section className="admin-card" aria-labelledby="report-detail"><div className="admin-section-heading"><h2 id="report-detail"><i className="bi bi-table" aria-hidden="true" />Detalle disponible por semillero</h2><span className="admin-badge">Catálogo activo</span></div><p className="text-muted small">Las actividades son las registradas como realizadas en cada semillero, sin filtro de período. No equivalen al total institucional ni al número de eventos de un mes.</p>
        {loading ? <p role="status">Cargando detalle…</p> : error ? <p>No hay detalle disponible en esta consulta.</p> : !data?.contenido.length ? <p>No se encontraron semilleros activos para esta selección.</p> : <><div className="table-responsive"><table className="table report-table"><caption>Resultados para {unidades.find(item => String(item.id) === appliedUnidad)?.nombre ?? 'todas las unidades'}</caption><thead><tr><th scope="col">Semillero</th><th scope="col">Unidad académica</th><th scope="col">Campus</th><th scope="col">Actividades realizadas</th></tr></thead><tbody>{data.contenido.map(item => <tr key={item.id}><th scope="row">{item.nombre}</th><td>{item.facultad}</td><td>{item.campus}</td><td>{item.totalActividadesCientificas ?? '—'}</td></tr>)}</tbody></table></div><nav className="admin-pagination" aria-label="Paginación de reportes"><button className="btn admin-outline" disabled={data.esPrimeraPagina} onClick={() => setPagina(value => value - 1)}>Anterior</button><span>Página {data.paginaActual + 1} de {data.totalPaginas}</span><button className="btn admin-outline" disabled={data.esUltimaPagina} onClick={() => setPagina(value => value + 1)}>Siguiente</button></nav></>}
      </section>
    </main><Footer />
  </div>;
}
