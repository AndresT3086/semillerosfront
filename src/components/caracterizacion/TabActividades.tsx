import type { ActividadesFormData, SiNo } from '../../types';

interface Props {
  value: ActividadesFormData;
  onChange: (value: ActividadesFormData) => void;
  onSave: () => void;
  onPrev: () => void;
  saving: boolean;
}

export default function TabActividades({ value, onChange, onSave, onPrev, saving }: Props) {
  const set = (field: keyof ActividadesFormData, fieldValue: SiNo) => {
    onChange({ ...value, [field]: fieldValue });
  };

  function RadioRow({ label, selected, onChange }: { label: string; selected: SiNo; onChange: (v: SiNo) => void }) {
    return (
      <tr>
        <td className="small py-2 pe-4">{label}</td>
        <td className="text-center" style={{ width: 60 }}>
          <input type="radio" name={label} checked={selected === 'si'} onChange={() => onChange('si')}
            style={{ accentColor: 'var(--udea-verde-principal)' }} />
        </td>
        <td className="text-center" style={{ width: 60 }}>
          <input type="radio" name={label} checked={selected === 'no'} onChange={() => onChange('no')}
            style={{ accentColor: 'var(--udea-verde-principal)' }} />
        </td>
      </tr>
    );
  }

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
        <div className="col-md-6">
          <p className="small fw-semibold mb-2" style={{ color: 'var(--udea-verde-oscuro)' }}>Actividades formativas</p>
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
              {tableHead}
              <tbody>
                <RadioRow label="Clubes de Revista" selected={value.clubes} onChange={v => set('clubes', v)} />
                <RadioRow label="Seminarios" selected={value.seminarios} onChange={v => set('seminarios', v)} />
                <RadioRow label="Salidas de campo" selected={value.salidas} onChange={v => set('salidas', v)} />
                <RadioRow label="Talleres" selected={value.talleres} onChange={v => set('talleres', v)} />
                <RadioRow label="Conversatorios" selected={value.conversatorios} onChange={v => set('conversatorios', v)} />
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <p className="small fw-semibold mb-2" style={{ color: 'var(--udea-verde-oscuro)' }}>Socialización y difusión</p>
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
              {tableHead}
              <tbody>
                <RadioRow label="Jornadas Universitarias" selected={value.jornadas} onChange={v => set('jornadas', v)} />
                <RadioRow label="Eventos RedCOLSI" selected={value.redColsi} onChange={v => set('redColsi', v)} />
                <RadioRow label="Ponencias Nacionales" selected={value.ponNac} onChange={v => set('ponNac', v)} />
                <RadioRow label="Ponencias Internacionales" selected={value.ponInt} onChange={v => set('ponInt', v)} />
              </tbody>
            </table>
          </div>
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
