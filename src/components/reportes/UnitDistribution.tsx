import { useEffect, useId, useState } from 'react';
import { getDistribucionDisponible, type DistribucionUnidad } from '../../api/semillerosApi';

const COLORS = ['#006d5b', '#7c9640', '#00a79d', '#b4d400'];

export function DistributionBars({ rows, metric, selectedId, onSelect }: {
  rows: DistribucionUnidad[];
  metric: 'semilleros' | 'estudiantes';
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const id = useId();
  const available = rows.filter(row => row[metric] !== null);
  if (!available.length) return <div className="distribution-empty"><i className="bi bi-people" aria-hidden="true" /><strong>Distribución no disponible</strong><p>Aún no hay un conteo de estudiantes por unidad académica. No se representan valores faltantes como cero.</p></div>;
  const max = Math.max(1, ...available.map(row => row[metric]!));
  return <><div className="distribution-axis" aria-hidden="true"><span>Cantidad de {metric}</span><span>Máximo: {max}</span></div><ul className="distribution-bars" aria-label={`Distribución de ${metric} por unidad académica`}>
    {available.map((row, index) => <li key={row.id}>
      <button type="button" className="distribution-row" aria-label={`${row.nombre} ${row[metric]}`} aria-pressed={selectedId === String(row.id)} aria-describedby={`${id}-${row.id}`} onClick={() => onSelect(String(row.id))}>
        <span className="distribution-name">{row.nombre}</span>
        <span className="distribution-track" aria-hidden="true"><span style={{ width: `${row[metric]! / max * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} /></span>
        <strong className="distribution-value">{row[metric]!.toLocaleString('es-CO')}</strong>
        <span role="tooltip" className="distribution-tooltip" id={`${id}-${row.id}`}>{row.nombre}: {row[metric]} {metric}. Selecciona para filtrar la tabla.</span>
      </button>
    </li>)}
  </ul>{available.every(row => row[metric] === 0) && <p className="text-muted small mt-3">No hay {metric} registrados en el catálogo para estas unidades.</p>}</>;
}

export default function UnitDistribution({ revision, selectedId, unsupported, selectedSemillero, onSelect }: {
  revision: number; selectedId: string; unsupported: boolean; selectedSemillero: boolean; onSelect: (id: string) => void;
}) {
  const [rows, setRows] = useState<DistribucionUnidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const blocked = unsupported || selectedSemillero;
  useEffect(() => {
    if (blocked) return;
    const controller = new AbortController();
    let disposed = false;
    setLoading(true);
    setError(false);
    setRows([]);
    getDistribucionDisponible(controller.signal)
      .then(result => { if (!controller.signal.aborted) setRows(result); })
      .catch(() => { if (!controller.signal.aborted) { setError(true); controller.abort(); } })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; controller.abort(); };
  }, [revision, retry, blocked]);
  const visibleRows = selectedId ? rows.filter(row => String(row.id) === selectedId) : rows;
  return <section className="admin-card" aria-labelledby="distribution-title">
    <div className="admin-section-heading"><h2 id="distribution-title"><i className="bi bi-bar-chart" aria-hidden="true" />Distribución por unidad académica</h2><span className="admin-badge">Catálogo público · Conteo parcial</span></div>
    <p className="text-muted small">Unidades del catálogo del backend. Se cuentan semilleros activos con caracterización completa. Selecciona una barra para filtrar la tabla inferior.</p>
    <p className="text-muted small">La agrupación por tipo (facultad, escuela, instituto o corporación) está pendiente de información oficial en la API.</p>
    {blocked ? <p role="status">La distribución no está disponible para los filtros aplicados. Consulta el estado actual sin seleccionar un semillero específico.</p> : loading ? <p role="status">Cargando distribución por unidad…</p> : error ? <div className="alert alert-warning" role="alert">No se pudo completar la distribución. No se muestran conteos parciales.<button className="btn admin-outline ms-2" onClick={() => setRetry(value => value + 1)}>Reintentar gráficos</button></div> : !visibleRows.length ? <p>No hay unidades disponibles para esta selección.</p> : <>
      {selectedId && <button className="btn admin-outline btn-sm mb-3" onClick={() => onSelect('')}>Ver todas las unidades</button>}
      <div className="row g-4"><div className="col-xl-7"><h3 className="admin-subtitle">Semilleros por unidad académica</h3><DistributionBars rows={visibleRows} metric="semilleros" selectedId={selectedId} onSelect={onSelect} /></div><div className="col-xl-5"><h3 className="admin-subtitle">Estudiantes por unidad académica</h3><DistributionBars rows={visibleRows} metric="estudiantes" selectedId={selectedId} onSelect={onSelect} /></div></div>
    </>}
  </section>;
}
