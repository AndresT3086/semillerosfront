import { useId } from 'react';
import type { ReporteKpis } from '../../api/reportesApi';
import { numero, porcentaje, variacion } from './formato';

function icono(tendencia: string | null) {
  if (tendencia === null) return 'info-circle';
  if (tendencia.startsWith('+')) return 'arrow-up-right';
  if (tendencia.startsWith('-')) return 'arrow-down-right';
  return 'dash-lg';
}

function KpiCard({ label, icon, value, note, tendencia, comparado, loading }: {
  label: string; icon: string; value: string | null; note: string; tendencia: string | null; comparado?: string; loading: boolean;
}) {
  const tooltipId = useId();
  const trendText = tendencia === null ? 'Tendencia no disponible' : `${tendencia} vs ${comparado}`;
  return <article className="admin-stat report-kpi" tabIndex={0} aria-describedby={tooltipId}>
    <span className="admin-stat-icon"><i className={`bi bi-${icon}`} aria-hidden="true" /></span>
    <div className="admin-stat-value">{loading ? '…' : value ?? '—'}</div>
    <h2>{label}</h2><p>{note}</p>
    <div className={`report-trend${tendencia?.startsWith('-') ? ' is-down' : tendencia?.startsWith('+') ? ' is-up' : ''}`}>
      <i className={`bi bi-${icono(tendencia)} me-1`} aria-hidden="true" />{trendText}
    </div>
    <span className="report-tooltip" role="tooltip" id={tooltipId}>
      {tendencia === null
        ? `Sin base de comparación frente a ${comparado ?? 'el período anterior'}.`
        : `Variación frente a ${comparado}: ${tendencia}.`}
    </span>
  </article>;
}

// HU1: cuatro indicadores principales con su tendencia frente al período anterior (RN4).
export default function KpiCards({ kpis, loading }: { kpis: ReporteKpis | null; loading: boolean }) {
  const comparado = kpis?.periodoComparado;
  const tendencias = kpis?.tendencias;
  return <section className="row g-3 mb-4 report-avoid-break" aria-label="Indicadores clave" aria-busy={loading}>
    <div className="col-sm-6 col-xl-3"><KpiCard label="Semilleros activos" icon="tree" loading={loading} comparado={comparado}
      value={kpis ? numero(kpis.semillerosActivos) : null} note="Excluye semilleros inactivos y borradores."
      tendencia={variacion(tendencias?.semillerosActivos)} /></div>
    <div className="col-sm-6 col-xl-3"><KpiCard label="Usuarios registrados" icon="people" loading={loading} comparado={comparado}
      value={kpis ? numero(kpis.usuariosRegistrados) : null} note="Personas únicas (por cédula) vinculadas a semilleros."
      tendencia={variacion(tendencias?.usuariosRegistrados)} /></div>
    <div className="col-sm-6 col-xl-3"><KpiCard label="Actividades realizadas" icon="calendar-check" loading={loading} comparado={comparado}
      value={kpis ? numero(kpis.actividadesRealizadas) : null} note="Actividades del formulario de caracterización que realizan los semilleros."
      tendencia={null} /></div>
    <div className="col-sm-6 col-xl-3"><KpiCard label="Tasa de participación" icon="pie-chart" loading={loading} comparado={comparado}
      value={kpis?.tasaParticipacion === undefined ? null : porcentaje(kpis.tasaParticipacion)}
      note={kpis ? `Miembros activos (${numero(kpis.miembrosActivos)}) / registrados × 100.` : 'Miembros activos / registrados × 100.'}
      tendencia={variacion(tendencias?.tasaParticipacion, 'pp')} /></div>
  </section>;
}
