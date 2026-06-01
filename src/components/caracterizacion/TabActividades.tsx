import type { ActividadFormItem, ActividadesFormData } from '../../types';

interface Props {
  value: ActividadesFormData;
  onChange: (value: ActividadesFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabActividades({ value, onChange, onSave, onPrev, saving }: Props) {
  const set = (idActividad: number, realiza: boolean) => {
    onChange(value.map(item => item.idActividad === idActividad ? { ...item, realiza } : item));
  };

  function RadioRow({ item }: { item: ActividadFormItem }) {
    return (
      <tr>
        <td className="small py-2 pe-4">{item.nombre}</td>
        <td className="text-center" style={{ width: 60 }}>
          <input type="radio" name={`actividad-${item.idActividad}`} checked={item.realiza} onChange={() => set(item.idActividad, true)}
            style={{ accentColor: 'var(--udea-verde-principal)' }} />
        </td>
        <td className="text-center" style={{ width: 60 }}>
          <input type="radio" name={`actividad-${item.idActividad}`} checked={!item.realiza} onChange={() => set(item.idActividad, false)}
            style={{ accentColor: 'var(--udea-verde-principal)' }} />
        </td>
      </tr>
    );
  }

  const categorias = Array.from(new Set(value.map(item => item.categoria || 'Actividades')));

  const tableHead = (
    <thead>
      <tr>
        <th className="small fw-semibold py-2" style={{ color: 'var(--udea-verde-oscuro)', background: 'var(--udea-gris-claro)' }}>Actividad</th>
        <th className="text-center small fw-semibold" style={{ background: 'var(--udea-gris-claro)', width: 60 }}>Sí</th>
        <th className="text-center small fw-semibold" style={{ background: 'var(--udea-gris-claro)', width: 60 }}>No</th>
      </tr>
    </thead>
  );

  return (
    <div>
      <div className="p-2 rounded mb-3 fw-semibold text-white small" style={{ background: 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))' }}>
        🔬 Actividades de Investigación
      </div>

      <div className="row g-3 mb-3">
        {categorias.map(categoria => (
          <div className="col-md-6" key={categoria}>
            <p className="small fw-semibold mb-2" style={{ color: 'var(--udea-verde-oscuro)' }}>{categoria}</p>
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
                {tableHead}
                <tbody>
                  {value
                    .filter(item => (item.categoria || 'Actividades') === categoria)
                    .map(item => <RadioRow key={item.idActividad} item={item} />)}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
