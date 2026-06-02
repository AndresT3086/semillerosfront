import { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle';
import type { FilterValues, FiltroItem } from '../types';
import { getUnidades, getCampus, getAreasOcde } from '../api/semillerosApi';

interface FiltersSectionProps {
  onFilter: (filters: FilterValues) => void;
}

export default function FiltersSection({ onFilter }: FiltersSectionProps) {
  const [filters, setFilters] = useState<FilterValues>({
    idUnidad: '',
    idArea: '',
    idCampus: '',
    q: '',
  });

  const [unidades, setUnidades] = useState<FiltroItem[]>([]);
  const [campus, setCampus] = useState<FiltroItem[]>([]);
  const [areas, setAreas] = useState<FiltroItem[]>([]);

  useEffect(() => {
    getUnidades().then(setUnidades).catch(() => {});
    getCampus().then(setCampus).catch(() => {});
    getAreasOcde().then(setAreas).catch(() => {});
  }, []);

  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sectionRef.current) return;
    const tooltipEls = sectionRef.current.querySelectorAll('[data-bs-toggle="tooltip"]');
    const instances = Array.from(tooltipEls).map((el) => new Tooltip(el));
    return () => instances.forEach((t) => t.dispose());
  }, []);

  const handleChange = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div ref={sectionRef} id="filters-section">
      <div className="filter-card">
        <h2 className="filter-title">Consultar semilleros</h2>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">
              Unidad Académica{' '}
              <i
                className="bi bi-question-circle-fill help-icon"
                data-bs-toggle="tooltip"
                title="Facultad, escuela o instituto al que pertenece el semillero. Ej: Facultad de Ciencias Económicas, Facultad de Ingeniería."
              ></i>
            </label>
            <select
              className="form-select"
              value={filters.idUnidad}
              onChange={(e) => handleChange('idUnidad', e.target.value)}
            >
              <option value="">Todas las unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">
              Área OCDE{' '}
              <i
                className="bi bi-question-circle-fill help-icon"
                data-bs-toggle="tooltip"
                title="Clasificación según la Organización para la Cooperación y el Desarrollo Económicos (OCDE). Agrupa las disciplinas científicas en grandes áreas del conocimiento."
              ></i>
            </label>
            <select
              className="form-select"
              value={filters.idArea}
              onChange={(e) => handleChange('idArea', e.target.value)}
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Campus</label>
            <select
              className="form-select"
              value={filters.idCampus}
              onChange={(e) => handleChange('idCampus', e.target.value)}
            >
              <option value="">Todos los campus</option>
              {campus.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-8">
            <label className="form-label">Buscar por nombre o palabra clave</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: finanzas, investigación, tecnología..."
              value={filters.q}
              onChange={(e) => handleChange('q', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onFilter(filters)}
            />
          </div>

          <div className="col-md-4 d-flex align-items-end">
            <button className="btn btn-udea w-100" onClick={() => onFilter(filters)}>
              <i className="bi bi-search me-2"></i>Buscar Semilleros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
