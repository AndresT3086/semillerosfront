import type { FiltroItem, OrganizacionFormData } from '../../types';

interface Props {
  value: OrganizacionFormData;
  recursos: FiltroItem[];
  fuentes: FiltroItem[];
  onChange: (value: OrganizacionFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabOrganizacion({ value, recursos, fuentes, onChange, onSave, onPrev, saving }: Props) {
  const set = (field: keyof OrganizacionFormData, fieldValue: number[]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  function toggleCheck(list: number[], item: number, field: 'recursos' | 'fuentes') {
    set(field, list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        🏢 Organización y Estructura
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Recursos con que cuenta</label>
        <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
          {recursos.map(r => (
            <label key={r.id} className="d-flex align-items-center gap-2 small" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={value.recursos.includes(r.id)} onChange={() => toggleCheck(value.recursos, r.id, 'recursos')}
                style={{ accentColor: 'var(--udea-verde-principal)' }} />
              {r.nombre}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{ color: 'var(--udea-verde-oscuro)' }}>Fuentes de financiación</label>
        <div className="p-2 rounded" style={{ background: 'var(--udea-gris-claro)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
          {fuentes.map(f => (
            <label key={f.id} className="d-flex align-items-center gap-2 small" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={value.fuentes.includes(f.id)} onChange={() => toggleCheck(value.fuentes, f.id, 'fuentes')}
                style={{ accentColor: 'var(--udea-verde-principal)' }} />
              {f.nombre}
            </label>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3" style={{ borderTop: '1px solid var(--udea-gris)' }}>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onPrev}>← Anterior</button>
        <button type="button" className="btn btn-sm fw-semibold px-4"
          style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))', color: 'white' }}
          onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
          Guardar y Continuar →
        </button>
      </div>
    </div>
  );
}
