import { useId } from 'react';
import type { ReporteUnidad } from '../../api/reportesApi';
import { COLORES, NOMBRE_TIPO, numero } from './formato';

export function DistributionBars({ rows, metric, selectedId, onSelect }: {
  rows: ReporteUnidad[];
  metric: 'semilleros' | 'estudiantes';
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const id = useId();
  const max = Math.max(1, ...rows.map(row => row[metric]));
  return <><div className="distribution-axis" aria-hidden="true"><span>Cantidad de {metric}</span><span>Máximo: {numero(max)}</span></div><ul className="distribution-bars" aria-label={`Distribución de ${metric} por unidad académica`}>
    {rows.map((row, index) => <li key={row.id}>
      <button type="button" className="distribution-row" aria-label={`${row.nombre} ${row[metric]}`} aria-pressed={selectedId === String(row.id)} aria-describedby={`${id}-${row.id}`} onClick={() => onSelect(String(row.id))}>
        <span className="distribution-name">{row.nombre}<small className="d-block text-muted">{NOMBRE_TIPO[row.tipo]}</small></span>
        <span className="distribution-track" aria-hidden="true"><span style={{ width: `${row[metric] / max * 100}%`, backgroundColor: COLORES[index % COLORES.length] }} /></span>
        <strong className="distribution-value">{numero(row[metric])}</strong>
        <span role="tooltip" className="distribution-tooltip" id={`${id}-${row.id}`}>{row.nombre}: {numero(row[metric])} {metric}. Selecciona para filtrar la tabla.</span>
      </button>
    </li>)}
  </ul></>;
}

// HU3: semilleros y estudiantes (personas activas únicas) por unidad académica.
export default function UnitDistribution({ rows, selectedId, onSelect }: {
  rows: ReporteUnidad[]; selectedId: string; onSelect: (id: string) => void;
}) {
  return <section className="admin-card report-avoid-break" aria-labelledby="distribution-title">
    <div className="admin-section-heading"><h2 id="distribution-title"><i className="bi bi-bar-chart" aria-hidden="true" />Distribución por unidad académica</h2><span className="admin-badge">{rows.length} unidades</span></div>
    <p className="text-muted small no-print">Selecciona una barra para filtrar el reporte y la tabla por esa unidad.</p>
    {!rows.length ? <p role="status">No hay semilleros activos en unidades académicas para los filtros aplicados.</p> : <>
      {selectedId && <button className="btn admin-outline btn-sm mb-3 no-print" onClick={() => onSelect('')}>Ver todas las unidades</button>}
      <div className="row g-4"><div className="col-xl-6"><h3 className="admin-subtitle">Semilleros por unidad académica</h3><DistributionBars rows={rows} metric="semilleros" selectedId={selectedId} onSelect={onSelect} /></div><div className="col-xl-6"><h3 className="admin-subtitle">Estudiantes por unidad académica</h3><DistributionBars rows={rows} metric="estudiantes" selectedId={selectedId} onSelect={onSelect} /></div></div>
    </>}
  </section>;
}
