import { useEffect, useState } from 'react';
import { getDistribucionCampus, type DistribucionCampus } from '../../api/semillerosApi';
const COLORS = ['#006d5b', '#7c9640', '#00a79d', '#b4d400', '#287843', '#68a79a', '#a6bb62'];
export function CampusChart({ rows, selectedId, onSelect }: { rows: DistribucionCampus[]; selectedId: string; onSelect: (id: string) => void }) {
  const total = rows.reduce((sum, row) => sum + row.semilleros, 0);
  const sorted = [...rows].sort((a, b) => b.semilleros - a.semilleros || a.nombre.localeCompare(b.nombre, 'es'));
  let offset = 0;
  return <div className="row g-4 align-items-center">
    <div className="col-lg-5"><svg viewBox="0 0 320 320" className="campus-donut" aria-label={`Distribución por campus: ${total} semilleros`}>
      <circle cx="160" cy="160" r="100" fill="none" stroke="#e4ece7" strokeWidth="55" />
      {sorted.map((row, index) => {
        if (!row.semilleros || !total) return null;
        const percent = row.semilleros / total * 100;
        const start = offset;
        offset += percent;
        const mid = (start + percent / 2) / 100 * Math.PI * 2 - Math.PI / 2;
        return <g key={row.id}>
          <circle className="campus-segment" cx="160" cy="160" r="100" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth={selectedId === String(row.id) ? 63 : 55} pathLength="100" strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset={-start} transform="rotate(-90 160 160)" role="button" tabIndex={0} aria-label={`${row.nombre}: ${row.semilleros} semilleros`} aria-pressed={selectedId === String(row.id)} onClick={() => onSelect(String(row.id))} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(String(row.id)); } }}><title>{row.nombre}: {row.semilleros} semilleros ({percent.toFixed(1)} %)</title></circle>
          {percent >= 7 && <text x={160 + Math.cos(mid) * 100} y={160 + Math.sin(mid) * 100} className="campus-count" textAnchor="middle" dominantBaseline="middle" aria-hidden="true">{row.semilleros}</text>}
        </g>;
      })}
      <text x="160" y="155" textAnchor="middle" className="campus-total">{total}</text><text x="160" y="181" textAnchor="middle" className="campus-caption">semilleros</text>
    </svg>{!total && <p className="text-center text-muted">No hay semilleros en los campus para esta selección.</p>}
    <p className="text-muted small text-center">Cantidades por sede. En segmentos pequeños, consulta el tooltip o su badge.</p></div>
    <div className="col-lg-7"><p className="small text-muted">Campus ordenados de mayor a menor concentración.</p><ul className="campus-badges">{sorted.map((row, index) => <li key={row.id}><button className="campus-badge" aria-label={`${row.nombre} ${row.semilleros}`} aria-pressed={selectedId === String(row.id)} onClick={() => onSelect(String(row.id))} title={`${row.nombre}: ${row.semilleros} semilleros`}><span className="campus-swatch" style={{ backgroundColor: COLORS[index % COLORS.length] }} aria-hidden="true" /><span>{row.nombre}</span><strong>{row.semilleros}</strong></button></li>)}</ul></div>
  </div>;
}
export default function CampusDistribution({ idUnidad, selectedId, revision, blocked, onSelect }: { idUnidad: string; selectedId: string; revision: number; blocked: boolean; onSelect: (id: string) => void }) {
  const [rows, setRows] = useState<DistribucionCampus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (blocked) return;
    const controller = new AbortController();
    let disposed = false;
    setLoading(true); setError(false); setRows([]);
    getDistribucionCampus(idUnidad, controller.signal).then(items => { if (!disposed) setRows(items); })
      .catch(() => { if (!disposed) { setError(true); controller.abort(); } })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; controller.abort(); };
  }, [idUnidad, revision, blocked, retry]);
  return <section className="admin-card" aria-labelledby="campus-title"><div className="admin-section-heading"><h2 id="campus-title"><i className="bi bi-geo-alt" aria-hidden="true" />Semilleros por Seccional/Campus</h2><span className="admin-badge">Catálogo público · Conteo parcial</span></div>
    <p className="text-muted small">Sedes del catálogo del backend. Incluye activos con caracterización completa. La distribución compara todos los campus de la unidad aplicada; al seleccionar una sede se filtran los indicadores y la tabla.</p>
    {blocked ? <p role="status">La distribución geográfica no está disponible para el período, tipo de unidad o semillero específico aplicado.</p> : loading ? <p role="status">Cargando distribución geográfica…</p> : error ? <div className="alert alert-warning" role="alert">No se pudo completar la distribución geográfica.<button className="btn admin-outline ms-2" onClick={() => setRetry(value => value + 1)}>Reintentar campus</button></div> : !rows.length ? <p>No hay campus disponibles.</p> : <>{selectedId && <button className="btn admin-outline btn-sm mb-3" onClick={() => onSelect('')}>Ver todos los campus</button>}<CampusChart rows={rows} selectedId={selectedId} onSelect={onSelect} /></>}
  </section>;
}
