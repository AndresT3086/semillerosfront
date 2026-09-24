import { useState } from 'react';
import type { ReporteEvolucion } from '../../api/reportesApi';
import { numero } from './formato';

const ANCHO = 640;
const ALTO = 260;
const MARGEN = { izquierda: 44, derecha: 16, arriba: 20, abajo: 36 };

// HU7: línea con relleno (RN25), marcadores visibles (RN26) y proyección punteada (RN27).
export default function EvolutionChart({ puntos }: { puntos: ReporteEvolucion[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const reales = puntos.filter(punto => !punto.proyectado);
  const proyeccion = puntos.find(punto => punto.proyectado);
  const max = Math.max(1, ...puntos.map(punto => punto.semillerosActivos));
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const x = (indice: number) => MARGEN.izquierda + (puntos.length === 1 ? anchoUtil / 2 : indice / (puntos.length - 1) * anchoUtil);
  const y = (valor: number) => MARGEN.arriba + altoUtil - valor / max * altoUtil;
  const linea = reales.map((punto, i) => `${i ? 'L' : 'M'}${x(i)},${y(punto.semillerosActivos)}`).join(' ');
  const area = reales.length ? `${linea} L${x(reales.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : '';
  const marcas = [0, Math.round(max / 2), max];
  const etiquetaCada = Math.ceil(puntos.length / 12);
  const seleccionado = activo === null ? null : puntos[activo];

  return <section className="admin-card h-100 mb-0 report-avoid-break" aria-labelledby="evolution-title">
    <div className="admin-section-heading"><h2 id="evolution-title"><i className="bi bi-graph-up" aria-hidden="true" />Evolución Semilleros</h2><span className="admin-badge">Activos acumulados por año</span></div>
    {!reales.length ? <p role="status">No hay semilleros con año de creación registrado para los filtros aplicados.</p> : <>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="evolution-chart" role="img" aria-label={`Evolución de semilleros activos de ${reales[0].anio} a ${reales[reales.length - 1].anio}`}>
        <defs><linearGradient id="evolution-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00a79d" stopOpacity=".35" /><stop offset="100%" stopColor="#00a79d" stopOpacity=".03" /></linearGradient></defs>
        {marcas.map(marca => <g key={marca}><line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(marca)} y2={y(marca)} className="evolution-grid" /><text x={MARGEN.izquierda - 8} y={y(marca) + 4} textAnchor="end" className="evolution-axis">{marca}</text></g>)}
        <path d={area} fill="url(#evolution-fill)" />
        <path d={linea} fill="none" stroke="#006d5b" strokeWidth="3" strokeLinejoin="round" />
        {proyeccion && <path d={`M${x(reales.length - 1)},${y(reales[reales.length - 1].semillerosActivos)} L${x(puntos.length - 1)},${y(proyeccion.semillerosActivos)}`} fill="none" stroke="#b4d400" strokeWidth="3" strokeDasharray="6 6" />}
        {puntos.map((punto, i) => <g key={punto.anio}>
          <circle cx={x(i)} cy={y(punto.semillerosActivos)} r={activo === i ? 8 : 6} className={`evolution-point${punto.proyectado ? ' is-projection' : ''}`}
            tabIndex={0} role="button" aria-label={`${punto.anio}: ${punto.semillerosActivos} semilleros activos${punto.proyectado ? ' (proyección)' : ''}`}
            onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)} onFocus={() => setActivo(i)} onBlur={() => setActivo(null)}>
            <title>{punto.anio}: {punto.semillerosActivos} semilleros activos{punto.proyectado ? ' (proyección)' : ''}</title>
          </circle>
          {i % etiquetaCada === 0 && <text x={x(i)} y={ALTO - 12} textAnchor="middle" className="evolution-axis">{punto.anio}</text>}
        </g>)}
      </svg>
      <p className="evolution-detail" role="status">{seleccionado
        ? `${seleccionado.anio}: ${numero(seleccionado.semillerosActivos)} semilleros activos${seleccionado.proyectado ? ' (proyección)' : ` · ${numero(seleccionado.nuevos)} creados ese año`}`
        : 'Pasa el mouse o navega con el teclado sobre un punto para ver el detalle.'}</p>
      {proyeccion && <p className="small text-muted mb-0"><span className="evolution-legend-projection" aria-hidden="true" /> Proyección lineal para {proyeccion.anio} con base en la tendencia histórica.</p>}
    </>}
  </section>;
}
