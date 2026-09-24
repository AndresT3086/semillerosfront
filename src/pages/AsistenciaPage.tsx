import { useEffect, useState, type FormEvent } from 'react';
import {
  actualizarSesion, eliminarSesion, getAsistenciaIntegrantes, getSesion, getSesiones, registrarSesion, sumarAsistencia,
  type ConteoAsistencia, type EstadoAsistencia, type IntegranteAsistencia, type Sesion,
} from '../api/asistenciaApi';
import { getPestanaActividades } from '../api/semillerosApi';
import type { ActividadFormItem } from '../types';
import Footer from '../components/Footer';
import '../styles/admin.css';
import '../styles/reports.css';

export const UMBRAL_BAJA_ASISTENCIA = 60;
const ESTADOS: { valor: EstadoAsistencia; etiqueta: string }[] = [
  { valor: 'PRESENTE', etiqueta: 'Presente' },
  { valor: 'AUSENTE', etiqueta: 'Ausente' },
  { valor: 'EXCUSADO', etiqueta: 'Excusado' },
];

interface Formulario {
  idSesion: number | null;
  titulo: string;
  fecha: string;
  idActividad: string;
  personas: { idIntegrante: number; nombre: string; cedula: string }[];
  estados: Record<number, EstadoAsistencia>;
}

function hoy() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function Porcentaje({ conteo, etiqueta }: { conteo: ConteoAsistencia; etiqueta: string }) {
  if (conteo.porcentaje === undefined) return <span className="text-muted">Sin registros</span>;
  return <div className="report-attendance">
    <div className="composition-progress" role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={conteo.porcentaje}>
      <span style={{ width: `${conteo.porcentaje}%`, backgroundColor: conteo.porcentaje < UMBRAL_BAJA_ASISTENCIA ? '#c28a00' : '#006d5b' }} />
    </div>
    <small>{conteo.porcentaje.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</small>
  </div>;
}

// Registro de actividades y asistencia del semillero por parte de su coordinador.
// % asistencia = presentes / (presentes + ausentes); las ausencias excusadas se descuentan.
export default function AsistenciaPage({ token, correo, idSemillero, nombreSemillero, onBack, onLogout }: {
  token: string; correo?: string; idSemillero: number; nombreSemillero: string; onBack: () => void; onLogout: () => void;
}) {
  const [periodo, setPeriodo] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; sesiones: Sesion[]; integrantes: IntegranteAsistencia[]; error: boolean } | null>(null);
  const [actividades, setActividades] = useState<ActividadFormItem[]>([]);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const clave = JSON.stringify([idSemillero, periodo, recarga]);
  const cargando = datos?.clave !== clave;
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    let activo = true;
    Promise.all([getSesiones(idSemillero, periodo, token), getAsistenciaIntegrantes(idSemillero, periodo, token)])
      .then(([sesiones, integrantes]) => { if (activo) setDatos({ clave, sesiones, integrantes, error: false }); })
      .catch(() => { if (activo) setDatos(previo => ({ clave, sesiones: previo?.sesiones ?? [], integrantes: previo?.integrantes ?? [], error: true })); });
    return () => { activo = false; };
  }, [idSemillero, periodo, token, clave]);

  useEffect(() => {
    let activo = true;
    getPestanaActividades(idSemillero, token)
      .then(respuesta => { if (activo) setActividades(respuesta.actividades); })
      .catch(() => { if (activo) setActividades([]); });
    return () => { activo = false; };
  }, [idSemillero, token]);

  const sesiones = datos?.sesiones ?? [];
  const integrantes = datos?.integrantes ?? [];
  const total = sumarAsistencia(sesiones.map(sesion => sesion.asistencia));
  const bajaAsistencia = integrantes.filter(i => i.asistencia.porcentaje !== undefined && i.asistencia.porcentaje < UMBRAL_BAJA_ASISTENCIA);

  function nuevaActividad() {
    const activos = integrantes.filter(i => i.activo);
    setMensaje(null);
    setFormulario({
      idSesion: null, titulo: '', fecha: hoy(), idActividad: '',
      personas: activos.map(({ idIntegrante, nombre, cedula }) => ({ idIntegrante, nombre, cedula })),
      estados: Object.fromEntries(activos.map(i => [i.idIntegrante, 'PRESENTE' as EstadoAsistencia])),
    });
  }

  function editar(idSesion: number) {
    setMensaje(null);
    getSesion(idSesion, token)
      .then(({ sesion, asistencias }) => setFormulario({
        idSesion, titulo: sesion.titulo, fecha: sesion.fecha, idActividad: sesion.idActividad ? String(sesion.idActividad) : '',
        personas: asistencias.map(({ idIntegrante, nombre, cedula }) => ({ idIntegrante, nombre, cedula })),
        estados: Object.fromEntries(asistencias.map(a => [a.idIntegrante, a.estado])),
      }))
      .catch((err: Error) => setMensaje({ ok: false, texto: `No se pudo abrir la actividad: ${err.message}` }));
  }

  function eliminar(sesion: Sesion) {
    if (!window.confirm(`¿Eliminar la actividad «${sesion.titulo}» del ${sesion.fecha} y su asistencia?`)) return;
    eliminarSesion(sesion.id, token)
      .then(() => { setMensaje({ ok: true, texto: 'Actividad eliminada.' }); setRecarga(v => v + 1); })
      .catch((err: Error) => setMensaje({ ok: false, texto: `No se pudo eliminar: ${err.message}` }));
  }

  function guardar(event: FormEvent) {
    event.preventDefault();
    if (!formulario) return;
    const cuerpo = {
      titulo: formulario.titulo.trim(),
      fecha: formulario.fecha,
      idActividad: formulario.idActividad ? Number(formulario.idActividad) : null,
      asistencias: formulario.personas.map(p => ({ idIntegrante: p.idIntegrante, estado: formulario.estados[p.idIntegrante] })),
    };
    setGuardando(true);
    (formulario.idSesion === null ? registrarSesion(idSemillero, cuerpo, token) : actualizarSesion(formulario.idSesion, cuerpo, token))
      .then(() => {
        setMensaje({ ok: true, texto: formulario.idSesion === null ? 'Actividad registrada.' : 'Actividad actualizada.' });
        setFormulario(null);
        setRecarga(v => v + 1);
      })
      .catch((err: Error) => setMensaje({ ok: false, texto: err.message }))
      .finally(() => setGuardando(false));
  }

  function marcar(idIntegrante: number, estado: EstadoAsistencia) {
    setFormulario(f => f && ({ ...f, estados: { ...f.estados, [idIntegrante]: estado } }));
  }

  return <div className="admin-dashboard">
    <header className="udea-header"><div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div><div className="udea-logo mb-1">UdeA <span>SIGSI</span></div><div className="system-title">{nombreSemillero}</div><span className="sigsi-badge">ASISTENCIA</span></div>
      <div className="d-flex gap-2 flex-wrap align-items-center">
        {correo && <span className="text-white small me-2">{correo}</span>}
        <button className="btn btn-outline-light" onClick={onBack}>← Volver a mis semilleros</button>
        <button className="btn btn-outline-light" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div></header>
    <main className="container admin-main">
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">REGISTRO DE ACTIVIDADES</p><h1>Asistencia del semillero</h1>
          <p className="text-muted mb-0">Las ausencias excusadas no cuentan en contra: % = presentes / (presentes + ausentes).</p></div>
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div><label htmlFor="asistencia-periodo" className="form-label small mb-1">Período</label>
            <select id="asistencia-periodo" className="form-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="">Todas las fechas</option>
              {years.map(year => <optgroup key={year} label={String(year)}><option value={year}>{year} · Año completo</option><option value={`${year}-1`}>{year}-1</option><option value={`${year}-2`}>{year}-2</option></optgroup>)}
            </select></div>
          <button className="btn btn-udea mt-0" onClick={nuevaActividad} disabled={cargando || formulario !== null}><i className="bi bi-plus-circle me-2" aria-hidden="true" />Registrar actividad</button>
        </div>
      </div>

      {mensaje && <div className={`alert ${mensaje.ok ? 'alert-success' : 'alert-danger'}`} role={mensaje.ok ? 'status' : 'alert'}>{mensaje.texto}</div>}
      {datos?.error && !cargando && <div className="alert alert-warning" role="alert">No se pudo consultar la asistencia.<button className="btn btn-link" onClick={() => setRecarga(v => v + 1)}>Reintentar</button></div>}

      {formulario && <section className="admin-card" aria-labelledby="form-actividad">
        <div className="admin-section-heading"><h2 id="form-actividad"><i className="bi bi-clipboard-check" aria-hidden="true" />{formulario.idSesion === null ? 'Nueva actividad' : 'Corregir actividad'}</h2></div>
        <form onSubmit={guardar}>
          <div className="row g-3 mb-3">
            <div className="col-md-5"><label htmlFor="actividad-titulo" className="form-label">Título *</label>
              <input id="actividad-titulo" className="form-control" required maxLength={200} value={formulario.titulo} onChange={e => setFormulario({ ...formulario, titulo: e.target.value })} placeholder="Ej: Taller de escritura científica" /></div>
            <div className="col-md-3"><label htmlFor="actividad-fecha" className="form-label">Fecha *</label>
              <input id="actividad-fecha" type="date" className="form-control" required max={hoy()} value={formulario.fecha} onChange={e => setFormulario({ ...formulario, fecha: e.target.value })} /></div>
            <div className="col-md-4"><label htmlFor="actividad-tipo" className="form-label">Tipo de actividad</label>
              <select id="actividad-tipo" className="form-select" value={formulario.idActividad} onChange={e => setFormulario({ ...formulario, idActividad: e.target.value })}>
                <option value="">Sin clasificar</option>
                {actividades.map(a => <option key={a.idActividad} value={a.idActividad}>{a.nombre}</option>)}
              </select></div>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="admin-subtitle mb-0">Lista de asistencia ({formulario.personas.length} integrantes)</h3>
            <button type="button" className="btn admin-outline btn-sm" disabled={!formulario.personas.length}
              onClick={() => setFormulario({ ...formulario, estados: Object.fromEntries(formulario.personas.map(p => [p.idIntegrante, 'PRESENTE' as EstadoAsistencia])) })}>Marcar todos presentes</button>
          </div>
          {!formulario.personas.length ? <p className="text-muted">El semillero no tiene integrantes activos. Aprueba solicitudes de inscripción para construir la lista.</p>
            : <div className="table-responsive"><table className="table report-table align-middle">
              <thead><tr><th scope="col">Integrante</th><th scope="col">Cédula</th><th scope="col">Asistencia</th></tr></thead>
              <tbody>{formulario.personas.map(p => <tr key={p.idIntegrante}>
                <th scope="row">{p.nombre}</th><td>{p.cedula}</td>
                <td><div className="btn-group btn-group-sm" role="radiogroup" aria-label={`Asistencia de ${p.nombre}`}>
                  {ESTADOS.map(({ valor, etiqueta }) => <label key={valor} className={`btn ${formulario.estados[p.idIntegrante] === valor ? 'btn-udea mt-0' : 'admin-outline'}`}>
                    <input type="radio" className="visually-hidden" name={`estado-${p.idIntegrante}`} value={valor}
                      checked={formulario.estados[p.idIntegrante] === valor} onChange={() => marcar(p.idIntegrante, valor)} />{etiqueta}
                  </label>)}
                </div></td>
              </tr>)}</tbody>
            </table></div>}
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-udea mt-0" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar asistencia'}</button>
            <button type="button" className="btn admin-outline" onClick={() => setFormulario(null)}>Cancelar</button>
          </div>
        </form>
      </section>}

      <section className="row g-3 mb-4" aria-label="Resumen de asistencia">
        <div className="col-md-4"><div className="admin-stat"><div className="admin-stat-value">{cargando ? '…' : total.porcentaje === undefined ? '—' : `${total.porcentaje.toLocaleString('es-CO', { minimumFractionDigits: 1 })} %`}</div><h2>Asistencia del semillero</h2><p>{total.presentes} presentes de {total.presentes + total.ausentes} esperadas · {total.excusados} excusadas</p></div></div>
        <div className="col-md-4"><div className="admin-stat"><div className="admin-stat-value">{cargando ? '…' : sesiones.length}</div><h2>Actividades registradas</h2><p>{periodo ? `En ${periodo}` : 'Todas las fechas'}</p></div></div>
        <div className="col-md-4"><div className="admin-stat"><div className="admin-stat-value">{cargando ? '…' : bajaAsistencia.length}</div><h2>Integrantes con baja asistencia</h2><p>Por debajo del {UMBRAL_BAJA_ASISTENCIA} %</p></div></div>
      </section>

      <section className="admin-card" aria-labelledby="lista-actividades">
        <div className="admin-section-heading"><h2 id="lista-actividades"><i className="bi bi-calendar-event" aria-hidden="true" />Actividades</h2></div>
        {cargando && !datos ? <p role="status">Cargando actividades…</p> : !sesiones.length ? <p>No hay actividades registradas en este período.</p>
          : <div className="table-responsive"><table className="table report-table align-middle">
            <thead><tr><th scope="col">Fecha</th><th scope="col">Actividad</th><th scope="col">Tipo</th><th scope="col">Presentes</th><th scope="col">Ausentes</th><th scope="col">Excusados</th><th scope="col">% Asistencia</th><th scope="col"><span className="visually-hidden">Acciones</span></th></tr></thead>
            <tbody>{sesiones.map(sesion => <tr key={sesion.id}>
              <td>{sesion.fecha}</td><th scope="row">{sesion.titulo}</th><td>{sesion.actividad ?? '—'}</td>
              <td>{sesion.asistencia.presentes}</td><td>{sesion.asistencia.ausentes}</td><td>{sesion.asistencia.excusados}</td>
              <td><Porcentaje conteo={sesion.asistencia} etiqueta={`Asistencia de ${sesion.titulo}`} /></td>
              <td className="text-nowrap"><button className="btn admin-outline btn-sm me-1" onClick={() => editar(sesion.id)} aria-label={`Editar ${sesion.titulo}`}><i className="bi bi-pencil" aria-hidden="true" /></button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(sesion)} aria-label={`Eliminar ${sesion.titulo}`}><i className="bi bi-trash" aria-hidden="true" /></button></td>
            </tr>)}</tbody>
          </table></div>}
      </section>

      <section className="admin-card" aria-labelledby="asistencia-integrantes">
        <div className="admin-section-heading"><h2 id="asistencia-integrantes"><i className="bi bi-people" aria-hidden="true" />Asistencia por integrante</h2></div>
        {!integrantes.length ? <p>No hay integrantes para mostrar.</p>
          : <div className="table-responsive"><table className="table report-table align-middle">
            <thead><tr><th scope="col">Integrante</th><th scope="col">Presentes</th><th scope="col">Ausentes</th><th scope="col">Excusados</th><th scope="col">% Asistencia</th></tr></thead>
            <tbody>{integrantes.map(i => <tr key={i.idIntegrante}>
              <th scope="row">{i.nombre}<small className="d-block text-muted">{i.cedula}{!i.activo && ' · Retirado'}</small>
                {i.asistencia.porcentaje !== undefined && i.asistencia.porcentaje < UMBRAL_BAJA_ASISTENCIA && <span className="report-state is-inactive mt-1">Baja asistencia</span>}</th>
              <td>{i.asistencia.presentes}</td><td>{i.asistencia.ausentes}</td><td>{i.asistencia.excusados}</td>
              <td><Porcentaje conteo={i.asistencia} etiqueta={`Asistencia de ${i.nombre}`} /></td>
            </tr>)}</tbody>
          </table></div>}
      </section>
    </main>
    <Footer />
  </div>;
}
