import type { OrdenRendimiento, OrdenTabla, ReporteRendimiento } from '../../api/reportesApi';
import type { PageResponse } from '../../types';
import { NOMBRE_TIPO, numero, porcentaje } from './formato';

const COLUMNAS: { clave: OrdenRendimiento | null; titulo: string }[] = [
  { clave: 'nombre', titulo: 'Semillero' },
  { clave: 'unidad', titulo: 'Unidad Académica' },
  { clave: 'tipo', titulo: 'Tipo' },
  { clave: 'participantes', titulo: 'Participantes' },
  { clave: 'sesiones', titulo: 'Actividades' },
  { clave: 'asistencia', titulo: '% Asistencia' },
  { clave: 'estado', titulo: 'Estado' },
];

// HU9: tabla paginada (RN31) y ordenable; el estado se muestra con color (RN32)
// y cada fila abre el detalle del semillero (RN34).
export default function RendimientoTable({ page, orden, onOrden, onPagina, onAbrir }: {
  page: PageResponse<ReporteRendimiento>;
  orden: OrdenTabla;
  onOrden: (orden: OrdenTabla) => void;
  onPagina: (pagina: number) => void;
  onAbrir: (id: number) => void;
}) {
  function ordenar(clave: OrdenRendimiento) {
    onOrden({ orden: clave, direccion: orden.orden === clave && orden.direccion === 'asc' ? 'desc' : 'asc' });
  }
  return <>
    <div className="table-responsive"><table className="table report-table align-middle">
      <caption className="visually-hidden">Rendimiento por semillero. Selecciona un encabezado para ordenar.</caption>
      <thead><tr>{COLUMNAS.map(columna => {
        const activa = columna.clave !== null && orden.orden === columna.clave;
        return <th key={columna.titulo} scope="col" aria-sort={activa ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : undefined}>
          {columna.clave === null ? columna.titulo : <button type="button" className="report-sort" onClick={() => ordenar(columna.clave!)}>
            {columna.titulo}<i className={`bi bi-${activa ? (orden.direccion === 'asc' ? 'sort-up' : 'sort-down') : 'arrow-down-up'} ms-1`} aria-hidden="true" />
          </button>}
        </th>;
      })}</tr></thead>
      <tbody>{page.contenido.map(fila => <tr key={fila.id} className="report-row" tabIndex={0} onClick={() => onAbrir(fila.id)}
        onKeyDown={event => { if (event.key === 'Enter') onAbrir(fila.id); }} aria-label={`Ver detalle de ${fila.nombre ?? fila.codigo}`}>
        <th scope="row">{fila.nombre ?? '(sin nombre)'}<small className="d-block text-muted">{fila.codigo}</small></th>
        <td>{fila.unidadAcademica ?? '—'}</td>
        <td>{NOMBRE_TIPO[fila.tipoUnidad]}</td>
        <td>{numero(fila.participantes)}</td>
        <td>{numero(fila.sesiones)}</td>
        <td>{fila.porcentajeAsistencia === undefined
          ? <span className="text-muted" title="No hay actividades con asistencia registrada en el período">Sin registros</span>
          : <div className="report-attendance"><div className="composition-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fila.porcentajeAsistencia} aria-label={`Asistencia de ${fila.nombre}`}><span style={{ width: `${fila.porcentajeAsistencia}%`, backgroundColor: '#006d5b' }} /></div><small>{porcentaje(fila.porcentajeAsistencia)}</small></div>}</td>
        <td><span className={`report-state ${fila.estado === 'ACTIVO' ? 'is-active' : 'is-inactive'}`}>{fila.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span></td>
      </tr>)}</tbody>
    </table></div>
    <nav className="admin-pagination no-print" aria-label="Paginación de la tabla de rendimiento">
      <button className="btn admin-outline" disabled={page.esPrimeraPagina} onClick={() => onPagina(page.paginaActual - 1)}>Anterior</button>
      <span>Página {page.paginaActual + 1} de {Math.max(page.totalPaginas, 1)} · {numero(page.totalElementos)} semilleros</span>
      <button className="btn admin-outline" disabled={page.esUltimaPagina} onClick={() => onPagina(page.paginaActual + 1)}>Siguiente</button>
    </nav>
  </>;
}
