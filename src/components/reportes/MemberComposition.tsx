import { useId } from 'react';
import type { ReportFilters } from '../../reports/filters';

// Las categorías y sus cantidades deben proceder del agregado del backend.
// Roles: porcentajes sobre asignaciones; no se presentan como personas únicas.
export interface CompositionCategory { id: string; nombre: string; cantidad: number }
export interface CompositionData { sexo: CompositionCategory[] | null; roles: CompositionCategory[] | null }
const COLORS = ['#006d5b', '#00a79d', '#b4d400', '#7c9640', '#68a79a'];
const PENDING_ROLES = ['Estudiante Investigador', 'Auxiliar', 'Coordinador', 'Tutor', 'Semillerista Junior'];
const format = (value: number) => value.toLocaleString('es-CO', { maximumFractionDigits: 1 });
function valid(items: CompositionCategory[] | null): items is CompositionCategory[] {
  return items !== null && items.every(item => Number.isSafeInteger(item.cantidad) && item.cantidad >= 0);
}

export function CompositionChart({ items, kind }: { items: CompositionCategory[] | null; kind: 'sexo' | 'roles' }) {
  const tooltipId = useId();
  const available = valid(items);
  const rows = available ? items : (kind === 'sexo' ? ['Femenino', 'Masculino'] : PENDING_ROLES).map(nombre => ({ id: nombre, nombre, cantidad: null }));
  const total = available ? items.reduce((sum, row) => sum + row.cantidad, 0) : null;
  let offset = 0;
  const portions = rows.map((row, index) => {
    const percent = total && row.cantidad !== null ? row.cantidad / total * 100 : 0;
    const start = offset; offset += percent;
    return { ...row, percent, start, color: COLORS[index % COLORS.length] };
  });
  return <div className="composition-chart">
    {!available && <p className="composition-notice" role="status">Datos no disponibles para la selección aplicada.</p>}
    {kind === 'sexo' && <svg viewBox="0 0 300 260" className="composition-donut" role="img" aria-label={total === null ? 'Distribución por sexo no disponible' : `Distribución por sexo: ${total} integrantes`}>
      <circle cx="150" cy="130" r="85" fill="none" stroke="#e4ece7" strokeWidth="42" />
      {portions.filter(row => row.percent > 0).map(row => <circle key={row.id} cx="150" cy="130" r="85" fill="none" stroke={row.color} strokeWidth="42" pathLength="100" strokeDasharray={`${row.percent} ${100 - row.percent}`} strokeDashoffset={-row.start} transform="rotate(-90 150 130)"><title>{row.nombre}: {row.cantidad} ({format(row.percent)} %)</title></circle>)}
      <text x="150" y="125" textAnchor="middle" className="campus-total">{total === null ? '—' : format(total)}</text><text x="150" y="152" textAnchor="middle" className="campus-caption">{total === null ? 'Sin datos' : 'integrantes'}</text>
    </svg>}
    {total === 0 && <p className="text-muted">No hay {kind === 'sexo' ? 'integrantes' : 'asignaciones de rol'} para estos filtros.</p>}
    <ul className="composition-list">{portions.map((row, index) => <li key={row.id} tabIndex={0} className="composition-item" aria-describedby={`${tooltipId}-${index}`}>
      <div className="composition-label"><span><span className="campus-swatch" style={{ backgroundColor: row.color }} aria-hidden="true" />{row.nombre}</span><strong>{row.cantidad === null ? '— · — %' : `${format(row.cantidad)} · ${format(row.percent)} %`}</strong></div>
      <div className="composition-progress" role={row.cantidad === null ? undefined : 'progressbar'} aria-label={row.nombre} aria-valuemin={row.cantidad === null ? undefined : 0} aria-valuemax={row.cantidad === null ? undefined : 100} aria-valuenow={row.cantidad === null ? undefined : row.percent} aria-valuetext={row.cantidad === null ? undefined : `${row.cantidad}; ${format(row.percent)} %`}><span style={{ width: `${row.percent}%`, backgroundColor: row.color }} /></div>
      <span className="composition-tooltip" id={`${tooltipId}-${index}`} role="tooltip">{row.nombre}: {row.cantidad === null ? 'cantidad y porcentaje no disponibles' : `${row.cantidad}; ${format(row.percent)} %`}</span>
    </li>)}</ul>
    <p className="text-muted small mt-3 mb-0">{kind === 'sexo' ? 'Los valores deben proceder del campo sexo. No se infieren a partir de nombres.' : 'Porcentajes sobre el total de asignaciones de rol de la selección. Una persona puede tener más de un rol.'}</p>
  </div>;
}

export default function MemberComposition({ filters }: { filters: ReportFilters }) {
  // No se consulta una ruta ficticia: aún no existe fuente para RN16/RN17.
  // Al implementar el endpoint, su respuesta debe corresponder a todos estos filtros.
  const scope = [filters.periodo || 'Estado actual', filters.tipoUnidad || 'Todos los tipos', filters.idUnidad ? `Unidad #${filters.idUnidad}` : 'Todas las unidades', filters.idCampus ? `Campus #${filters.idCampus}` : 'Todos los campus', filters.idSemillero ? `Semillero #${filters.idSemillero}` : 'Todos los semilleros'].join(' · ');
  return <section aria-label="Composición de integrantes" className="mb-4">
    <p className="small text-muted" aria-live="polite">Composición para: {scope}</p>
    <div className="row g-4">
      <div className="col-lg-6"><section className="admin-card h-100 mb-0" aria-labelledby="sex-title"><div className="admin-section-heading"><h2 id="sex-title"><i className="bi bi-pie-chart" aria-hidden="true" />Integrantes por Sexo</h2><span className="admin-badge">Pendiente de datos</span></div><CompositionChart items={null} kind="sexo" /></section></div>
      <div className="col-lg-6"><section className="admin-card h-100 mb-0" aria-labelledby="roles-title"><div className="admin-section-heading"><h2 id="roles-title"><i className="bi bi-people" aria-hidden="true" />Integrantes según Rol Desempeñado</h2><span className="admin-badge">Pendiente de datos</span></div><CompositionChart items={null} kind="roles" /><p className="text-muted small mt-3">Categorías solicitadas para esta vista; pendientes de confirmar con el catálogo de roles del sistema.</p></section></div>
    </div>
  </section>;
}
