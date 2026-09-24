import { useEffect, useState, type ReactNode } from 'react';
import { getSemilleros, getUnidades } from '../api/semillerosApi';
import type { FiltroItem, PageResponse, SemilleroResumen } from '../types';
import DetailsModal from '../components/DetailsModal';
import Footer from '../components/Footer';
import '../styles/admin.css';

function Section({ title, icon, children, action }: { title: string; icon: string; children: ReactNode; action?: ReactNode }) {
  return <section className="admin-card"><div className="admin-section-heading"><h2><i className={`bi bi-${icon}`} aria-hidden="true" />{title}</h2>{action}</div>{children}</section>;
}
function Pending({ children }: { children: ReactNode }) {
  return <div className="admin-pending"><i className="bi bi-hourglass-split" aria-hidden="true" /><div><strong>Próximamente</strong><p>{children}</p></div></div>;
}

export default function AdminDashboardPage({ correo, preview = false, onLogout, onReports }: { correo?: string; preview?: boolean; onLogout: () => void; onReports?: () => void }) {
  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState<PageResponse<SemilleroResumen> | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ q: '', idUnidad: '' });
  const [pagina, setPagina] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCatalogError(false);
    setTotal(null);
    Promise.all([getUnidades(), getSemilleros({ q: '', idUnidad: '', idCampus: '', idArea: '' }, 0, 1)])
      .then(([items, data]) => { if (!cancelled) { setUnidades(items); setTotal(data.totalElementos); } })
      .catch(() => { if (!cancelled) { setCatalogError(true); setUnidades([]); } });
    return () => { cancelled = true; };
  }, [refresh]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSemilleros({ ...filters, idCampus: '', idArea: '' }, pagina, 6)
      .then(data => { if (!cancelled) setPage(data); })
      .catch(() => { if (!cancelled) { setPage(null); setError('No se pudieron cargar los semilleros. Intenta nuevamente.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, pagina, refresh]);
  const stats = [
    { label: 'Usuarios totales', value: '—', note: 'Consulta de usuarios pendiente', icon: 'people' },
    { label: 'Semilleros activos', value: total?.toLocaleString('es-CO') ?? '—', note: 'Registrados en el catálogo público', icon: 'tree' },
    { label: 'Solicitudes pendientes', value: '—', note: 'Consulta administrativa pendiente', icon: 'inbox' },
    { label: 'Unidades académicas', value: catalogError || total === null ? '—' : unidades.length.toLocaleString('es-CO'), note: 'Unidades del catálogo institucional', icon: 'buildings' },
  ];
  return <div className="admin-dashboard">
    <header className="udea-header"><div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div><div className="udea-logo mb-1">UdeA <span>SEMILLEROS</span></div><div className="system-title">Sistema de Gestión de Semilleros · SIGSI</div><span className="sigsi-badge"><i className="bi bi-shield-check me-2" />ADMINISTRACIÓN</span></div>
      <div className="admin-account">{correo && <span>{correo}</span>}<button className="btn btn-outline-light" onClick={onLogout}>{preview ? 'Volver al portal' : 'Cerrar sesión'}<i className="bi bi-box-arrow-right ms-2" /></button></div>
    </div></header>
    <main className="container admin-main">
      {preview && <div className="admin-preview" role="note"><i className="bi bi-eye me-2" /><strong>Vista previa local.</strong> Solo muestra datos públicos. La gestión administrativa aún no está habilitada.</div>}
      {onReports && <button className="btn btn-udea mb-2" onClick={onReports}><i className="bi bi-bar-chart me-2" />Reportes y estadísticas</button>}
      <div className="admin-page-heading"><div><p className="admin-eyebrow">GESTIÓN INSTITUCIONAL</p><h1>Panel de administración</h1><p className="text-muted mb-0">Una mirada general a los semilleros de investigación de la Universidad.</p></div><button className="btn admin-outline" onClick={() => setRefresh(value => value + 1)} disabled={loading}><i className="bi bi-arrow-clockwise me-2" />Actualizar datos</button></div>
      <div className="row g-3 mb-4">{stats.map(stat => <div className="col-12 col-sm-6 col-xl-3" key={stat.label}><div className="admin-stat"><span className="admin-stat-icon"><i className={`bi bi-${stat.icon}`} /></span><div className="admin-stat-value">{stat.value}</div><h2>{stat.label}</h2><p>{stat.note}</p></div></div>)}</div>
      {catalogError && <div className="alert alert-warning" role="alert">No se pudo cargar el resumen. Usa «Actualizar datos» para reintentar.</div>}
      <Section title="Solicitudes recientes" icon="inbox" action={<span className="admin-badge">Gestión pendiente</span>}>
        <div className="row g-3"><div className="col-md-6"><h3 className="admin-subtitle">Nuevos semilleros</h3><Pending>Aquí podrás revisar y resolver las solicitudes de creación de semilleros.</Pending></div><div className="col-md-6"><h3 className="admin-subtitle">Afiliaciones y cambios de rol</h3><Pending>Las solicitudes de afiliación y coordinación estarán disponibles en esta sección.</Pending></div></div>
      </Section>
      <Section title="Alertas de actualización" icon="clock-history"><Pending>La consulta de última actualización y el envío de recordatorios aún no están disponibles.</Pending><button className="btn admin-outline mt-3" disabled>Enviar recordatorios</button></Section>
      <Section title="Buscar usuario por cédula" icon="person-vcard"><p className="text-muted">La búsqueda, creación de usuarios y asignación de roles estarán disponibles en una próxima etapa.</p><fieldset disabled><div className="row g-3"><div className="col-md-8"><label className="form-label" htmlFor="admin-documento">Número de cédula</label><div className="input-group"><input id="admin-documento" className="form-control" placeholder="Ingrese el número de cédula" /><button className="btn admin-outline">Buscar</button></div></div><div className="col-md-4 d-flex align-items-end"><button className="btn admin-outline w-100"><i className="bi bi-person-plus me-2" />Nuevo usuario</button></div></div></fieldset></Section>
      <div className="row g-4"><div className="col-lg-8"><Section title="Semilleros" icon="tree" action={<span className="admin-badge">Solo consulta</span>}>
        <form className="row g-2 mb-3" onSubmit={event => { event.preventDefault(); setPagina(0); setFilters(value => ({ ...value, q: query.trim() })); }}>
          <div className="col-md-6"><label htmlFor="admin-search" className="form-label">Buscar semillero</label><input id="admin-search" className="form-control" placeholder="Nombre o palabra clave" value={query} onChange={event => setQuery(event.target.value)} /></div>
          <div className="col-md-6"><label htmlFor="admin-unit" className="form-label">Unidad académica</label><select id="admin-unit" className="form-select" value={filters.idUnidad} onChange={event => { setPagina(0); setFilters(value => ({ ...value, idUnidad: event.target.value })); }}><option value="">Todas las unidades</option>{unidades.map(unit => <option key={unit.id} value={unit.id}>{unit.nombre}</option>)}</select></div>
          <div className="col-12"><button className="btn admin-outline" type="submit"><i className="bi bi-search me-2" />Buscar</button></div>
        </form>
        <div aria-live="polite" aria-busy={loading}>{loading ? <p className="admin-loading"><span className="spinner-border spinner-border-sm me-2" />Cargando semilleros…</p> : error ? <div className="alert alert-danger" role="alert">{error}<button className="btn btn-link" onClick={() => setRefresh(value => value + 1)}>Reintentar</button></div> : !page?.contenido.length ? <p className="admin-loading">No se encontraron semilleros con estos filtros.</p> : <><p className="text-muted small">{page.totalElementos} semilleros encontrados</p><ul className="admin-semillero-list">{page.contenido.map(item => <li key={item.id}><div className="admin-tree"><i className="bi bi-tree" /></div><div className="admin-semillero-info"><h3>{item.nombre}</h3><p>{item.facultad} · {item.campus}</p><span className="admin-badge">{item.estado}</span><span className="small text-muted ms-2">{item.totalSemilleristas ?? 0} integrantes</span></div><button className="btn admin-outline btn-sm" onClick={() => setSelectedId(item.id)} aria-label={`Ver detalle de ${item.nombre}`}>Ver detalle</button></li>)}</ul><nav className="admin-pagination" aria-label="Paginación de semilleros"><button className="btn admin-outline btn-sm" disabled={page.esPrimeraPagina} onClick={() => setPagina(value => value - 1)}>Anterior</button><span>Página {page.paginaActual + 1} de {page.totalPaginas}</span><button className="btn admin-outline btn-sm" disabled={page.esUltimaPagina} onClick={() => setPagina(value => value + 1)}>Siguiente</button></nav></>}</div>
      </Section></div><div className="col-lg-4"><Section title="Usuarios y roles" icon="people"><Pending>Podrás consultar los usuarios y sus roles en los distintos semilleros.</Pending></Section><div className="admin-footnote"><i className="bi bi-info-circle me-2" />Las cifras no disponibles se muestran con «—». El listado corresponde al catálogo público de semilleros activos.</div></div></div>
    </main><Footer /><DetailsModal semilleroId={selectedId} isOpen={selectedId !== null} onClose={() => setSelectedId(null)} />
  </div>;
}
