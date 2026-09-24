import type { ReporteUnidad } from '../../api/reportesApi';
import { COLORES, numero } from './formato';

// HU6: ranking de facultades por semilleros. El backend incluye empates en el quinto puesto (RN21).
export default function TopFacultades({ rows, selectedId, onSelect }: {
  rows: ReporteUnidad[]; selectedId: string; onSelect: (id: string) => void;
}) {
  const max = Math.max(1, ...rows.map(row => row.semilleros));
  return <section className="admin-card h-100 mb-0 report-avoid-break" aria-labelledby="top-title">
    <div className="admin-section-heading"><h2 id="top-title"><i className="bi bi-trophy" aria-hidden="true" />Top 5 Facultades con más Semilleros</h2></div>
    {!rows.length ? <p role="status">No hay facultades con semilleros activos para los filtros aplicados.</p> : <>
      <svg viewBox={`0 0 400 ${rows.length * 44}`} className="top-chart" role="img" aria-label={`Top facultades: ${rows.map(row => `${row.nombre} ${row.semilleros}`).join(', ')}`}>
        {rows.map((row, index) => {
          const width = row.semilleros / max * 300;
          return <g key={row.id} transform={`translate(0 ${index * 44})`}>
            <rect x="0" y="6" width={Math.max(width, 2)} height="30" rx="4" fill={COLORES[index % COLORES.length]}><title>{row.nombre}: {row.semilleros} semilleros</title></rect>
            <text x={Math.max(width, 2) + 8} y="26" className="top-chart-value">{numero(row.semilleros)}</text>
          </g>;
        })}
      </svg>
      <ol className="top-list">
        {rows.map((row, index) => <li key={row.id}>
          <button type="button" className="top-item" aria-pressed={selectedId === String(row.id)} onClick={() => onSelect(String(row.id))} aria-label={`${index + 1}. ${row.nombre}: ${row.semilleros} semilleros`}>
            <span className="top-rank" style={{ backgroundColor: COLORES[index % COLORES.length] }}>{index + 1}</span>
            <span className="top-name">{row.nombre}</span>
            <strong>{numero(row.semilleros)}</strong>
          </button>
        </li>)}
      </ol>
      {rows.length > 5 && <p className="small text-muted mb-0">Se muestran {rows.length} facultades por empate en el quinto puesto.</p>}
    </>}
  </section>;
}
