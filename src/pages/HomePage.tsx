import { useEffect, useRef, useState } from 'react';
import type { FilterValues, SemilleroResumen } from '../types';
import { getSemilleros } from '../api/semillerosApi';
import Header from '../components/Header';
import FiltersSection from '../components/FiltersSection';
import SemilleroList from '../components/SemilleroList';
import DetailsModal from '../components/DetailsModal';
import RegistrationModal from '../components/RegistrationModal';
import Footer from '../components/Footer';

const EMPTY_FILTERS: FilterValues = { idUnidad: '', idArea: '', idCampus: '', q: '' };

interface HomePageProps {
  onAccesoSigsi: () => void;
}

export default function HomePage({ onAccesoSigsi }: HomePageProps) {
  const [semilleros, setSemilleros] = useState<SemilleroResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<FilterValues>(EMPTY_FILTERS);

  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [registrationNombre, setRegistrationNombre] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  const filtersSectionRef = useRef<HTMLDivElement>(null);

  async function cargarSemilleros(filters: FilterValues, pagina: number) {
    setLoading(true);
    setError(null);
    try {
      const page = await getSemilleros(filters, pagina);
      setSemilleros(page.contenido);
      setPaginaActual(page.paginaActual);
      setTotalPaginas(page.totalPaginas);
      setTotalElementos(page.totalElementos);
    } catch {
      setError('No se pudo cargar la lista de semilleros.');
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial
  useEffect(() => {
    cargarSemilleros(EMPTY_FILTERS, 0);
  }, []);

  function handleFilter(filters: FilterValues) {
    setCurrentFilters(filters);
    cargarSemilleros(filters, 0);
  }

  function handlePagina(pagina: number) {
    cargarSemilleros(currentFilters, pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleVerDetalles(id: number) {
    setDetailsId(id);
    setShowDetails(true);
  }

  function handleInscribirse(id: number, nombre: string) {
    setRegistrationId(id);
    setRegistrationNombre(nombre);
    setShowRegistration(true);
  }

  function scrollToFilters() {
    filtersSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <Header onScrollToFilters={scrollToFilters} onAccesoSigsi={onAccesoSigsi} />

      <main className="container py-4">
        {/* Intro + stats */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="filter-card">
              <h2 className="filter-title">Portal de Semilleros de Investigación</h2>
              <p className="mb-3">
                Bienvenido al portal de semilleros de investigación de la Universidad de Antioquia.
                Aquí podrás explorar todos los semilleros activos, conocer sus objetivos, áreas de
                investigación y realizar tu inscripción para participar en ellos.
              </p>
              <div className="row">
                <div className="col-md-4 col-6">
                  <div className="stats-card">
                    <div className="stat-number">{totalElementos || '—'}</div>
                    <div className="stat-label">Semilleros Activos</div>
                  </div>
                </div>
                <div className="col-md-4 col-6">
                  <div className="stats-card">
                    <div className="stat-number">
                      {semilleros.reduce((acc, s) => acc + s.totalSemilleristas, 0) || '—'}
                    </div>
                    <div className="stat-label">Semilleristas</div>
                  </div>
                </div>
                <div className="col-md-4 col-6">
                  <div className="stats-card">
                    <div className="stat-number">
                      {semilleros.reduce((acc, s) => acc + s.totalActividadesCientificas, 0) || '—'}
                    </div>
                    <div className="stat-label">Actividades científicas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4" ref={filtersSectionRef}>
          <div className="col-12">
            <FiltersSection onFilter={handleFilter} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Semillero list */}
        <div className="row gy-4">
          <SemilleroList
            semilleros={semilleros}
            loading={loading}
            onInscribirse={handleInscribirse}
            onVerDetalles={handleVerDetalles}
          />
        </div>

        {/* Pagination */}
        {!loading && totalPaginas > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination">
                <li className={`page-item${paginaActual === 0 ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePagina(paginaActual - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <li key={i} className={`page-item${i === paginaActual ? ' active' : ''}`}>
                    <button className="page-link" onClick={() => handlePagina(i)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item${paginaActual === totalPaginas - 1 ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePagina(paginaActual + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </main>

      <Footer />

      <DetailsModal
        semilleroId={detailsId}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onInscribirse={handleInscribirse}
      />

      <RegistrationModal
        semilleroId={registrationId}
        semilleroNombre={registrationNombre}
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
      />
    </>
  );
}
