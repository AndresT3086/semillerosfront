import type { ReporteConteo } from '../../api/reportesApi';
import { COLORES, numero } from './formato';

export function CampusChart({ rows, selectedId, onSelect }: { rows: ReporteConteo[]; selectedId: string; onSelect: (id: string) => void }) {
  const total = rows.reduce((sum, row) => sum + row.cantidad, 0);
  const sorted = [...rows].sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es'));
  const inicios = sorted.map((_, index) => sorted.slice(0, index).reduce((sum, row) => sum + (total ? row.cantidad / total * 100 : 0), 0));
  return <div className="row g-4 align-items-center">
    <div className="col-lg-5"><svg viewBox="0 0 320 320" className="campus-donut" aria-label={`Distribución por campus: ${total} semilleros`}>
      <circle cx="160" cy="160" r="100" fill="none" stroke="#e4ece7" strokeWidth="55" />
      {sorted.map((row, index) => {
        if (!row.cantidad || !total) return null;
        const percent = row.cantidad / total * 100;
        const start = inicios[index];
        const mid = (start + percent / 2) / 100 * Math.PI * 2 - Math.PI / 2;
        return <g key={row.id}>
          <circle className="campus-segment" cx="160" cy="160" r="100" fill="none" stroke={COLORES[index % COLORES.length]} strokeWidth={selectedId === row.id ? 63 : 55} pathLength="100" strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset={-start} transform="rotate(-90 160 160)" role="button" tabIndex={0} aria-label={`${row.nombre}: ${row.cantidad} semilleros`} aria-pressed={selectedId === row.id} onClick={() => onSelect(row.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.id); } }}><title>{row.nombre}: {row.cantidad} semilleros ({percent.toFixed(1)} %)</title></circle>
          {percent >= 7 && <text x={160 + Math.cos(mid) * 100} y={160 + Math.sin(mid) * 100} className="campus-count" textAnchor="middle" dominantBaseline="middle" aria-hidden="true">{row.cantidad}</text>}
        </g>;
      })}
      <text x="160" y="155" textAnchor="middle" className="campus-total">{numero(total)}</text><text x="160" y="181" textAnchor="middle" className="campus-caption">semilleros</text>
    </svg>{!total && <p className="text-center text-muted">No hay semilleros en los campus para esta selección.</p>}
    <p className="text-muted small text-center">Cantidades por sede. En segmentos pequeños, consulta el tooltip o su badge.</p></div>
    <div className="col-lg-7"><p className="small text-muted">Campus ordenados de mayor a menor concentración.</p><ul className="campus-badges">{sorted.map((row, index) => <li key={row.id}><button className="campus-badge" aria-label={`${row.nombre} ${row.cantidad}`} aria-pressed={selectedId === row.id} onClick={() => onSelect(row.id)} title={`${row.nombre}: ${row.cantidad} semilleros`}><span className="campus-swatch" style={{ backgroundColor: COLORES[index % COLORES.length] }} aria-hidden="true" /><span>{row.nombre}</span><strong>{numero(row.cantidad)}</strong></button></li>)}</ul></div>
  </div>;
}

// HU4: cobertura geográfica por sede. Al seleccionar una sede se filtra el reporte y la tabla.
export default function CampusDistribution({ rows, selectedId, onSelect }: { rows: ReporteConteo[]; selectedId: string; onSelect: (id: string) => void }) {
  return <section className="admin-card report-avoid-break" aria-labelledby="campus-title"><div className="admin-section-heading"><h2 id="campus-title"><i className="bi bi-geo-alt" aria-hidden="true" />Semilleros por Seccional/Campus</h2><span className="admin-badge">{rows.length} sedes</span></div>
    {!rows.length ? <p role="status">No hay campus disponibles.</p> : <>{selectedId && <button className="btn admin-outline btn-sm mb-3 no-print" onClick={() => onSelect('')}>Ver todos los campus</button>}<CampusChart rows={rows} selectedId={selectedId} onSelect={onSelect} /></>}
  </section>;
}
