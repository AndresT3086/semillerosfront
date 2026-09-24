import type { ReporteDashboard } from '../../api/reportesApi';
import { numero, porcentaje } from './formato';

// HU9: asistencia a las actividades registradas por los coordinadores.
// Se suman las asistencias esperadas de todos los semilleros (no se promedian sus porcentajes)
// y las ausencias excusadas se descuentan.
export default function AttendanceSummary({ datos }: { datos: ReporteDashboard['asistencia'] }) {
  const { sesiones, asistencia } = datos;
  const esperadas = asistencia.presentes + asistencia.ausentes;
  return <section className="admin-card report-avoid-break" aria-labelledby="attendance-title">
    <div className="admin-section-heading"><h2 id="attendance-title"><i className="bi bi-clipboard-check" aria-hidden="true" />Asistencia a actividades</h2><span className="admin-badge">Excusas descontadas</span></div>
    {!sesiones ? <p role="status">No hay actividades con asistencia registrada para los filtros aplicados.</p> : <div className="row g-4 align-items-center">
      <div className="col-md-4 text-center">
        <div className="attendance-value">{asistencia.porcentaje === undefined ? '—' : porcentaje(asistencia.porcentaje)}</div>
        <p className="text-muted small mb-0">asistencia promedio ponderada</p>
      </div>
      <div className="col-md-8">
        <div className="composition-progress mb-3" role="progressbar" aria-label="Asistencia a actividades" aria-valuemin={0} aria-valuemax={100} aria-valuenow={asistencia.porcentaje ?? 0}>
          <span style={{ width: `${asistencia.porcentaje ?? 0}%`, backgroundColor: '#006d5b' }} />
        </div>
        <ul className="activities-legend">
          <li><span>Actividades registradas</span><strong>{numero(sesiones)}</strong></li>
          <li><span>Asistencias esperadas</span><strong>{numero(esperadas)}</strong></li>
          <li><span>Presentes</span><strong>{numero(asistencia.presentes)}</strong></li>
          <li><span>Ausencias excusadas</span><strong>{numero(asistencia.excusados)}</strong></li>
        </ul>
      </div>
    </div>}
  </section>;
}
