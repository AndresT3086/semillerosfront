import type { ReporteConteo } from '../../api/reportesApi';
import { COLORES, numero, porcentaje } from './formato';

// HU8: actividades registradas en el período por tipo del catálogo (RN28), con cantidad y porcentaje (RN30).
export default function ActivitiesByType({ rows }: { rows: ReporteConteo[] }) {
  const total = rows.reduce((sum, row) => sum + row.cantidad, 0);
  const conDatos = rows.map((row, index) => ({ ...row, color: COLORES[index % COLORES.length], percent: total ? row.cantidad / total * 100 : 0 }));
  const inicios = conDatos.map((_, index) => conDatos.slice(0, index).reduce((sum, row) => sum + row.percent, 0));
  return <section className="admin-card report-avoid-break" aria-labelledby="activities-title">
    <div className="admin-section-heading"><h2 id="activities-title"><i className="bi bi-calendar2-week" aria-hidden="true" />Actividades por Tipo</h2><span className="admin-badge">Actividades registradas</span></div>
    {!total ? <p role="status">No hay actividades registradas en el período para los filtros aplicados.</p> : <div className="row g-4 align-items-center">
      <div className="col-lg-4"><svg viewBox="0 0 240 240" className="composition-donut" role="img" aria-label={`Actividades por tipo: ${total} actividades`}>
        <circle cx="120" cy="120" r="80" fill="none" stroke="#e4ece7" strokeWidth="40" />
        {conDatos.map((row, index) => {
          if (!row.cantidad) return null;
          const start = inicios[index];
          return <circle key={row.id} cx="120" cy="120" r="80" fill="none" stroke={row.color} strokeWidth="40" pathLength="100" strokeDasharray={`${row.percent} ${100 - row.percent}`} strokeDashoffset={-start} transform="rotate(-90 120 120)"><title>{row.nombre}: {row.cantidad} ({porcentaje(row.percent)})</title></circle>;
        })}
        <text x="120" y="118" textAnchor="middle" className="campus-total">{numero(total)}</text><text x="120" y="142" textAnchor="middle" className="campus-caption">actividades</text>
      </svg></div>
      <div className="col-lg-8">
        <div className="activities-stack" role="img" aria-label="Porcentaje de cada tipo de actividad">
          {conDatos.filter(row => row.cantidad > 0).map(row => <span key={row.id} style={{ width: `${row.percent}%`, backgroundColor: row.color }} title={`${row.nombre}: ${porcentaje(row.percent)}`} />)}
        </div>
        <ul className="activities-legend">
          {conDatos.map(row => <li key={row.id}><span className="campus-swatch" style={{ backgroundColor: row.color }} aria-hidden="true" /><span>{row.nombre}</span><strong>{numero(row.cantidad)} · {porcentaje(row.percent)}</strong></li>)}
        </ul>
      </div>
    </div>}
  </section>;
}
