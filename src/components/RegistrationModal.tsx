import { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import type { InscripcionFormData, InscripcionFormErrors } from '../types';
import { submitInscripcion } from '../api/semillerosApi';

const EMPTY_FORM: InscripcionFormData = {
  nombres: '',
  apellidos: '',
  cedula: '',
  correo: '',
  telefono: '',
  programa: '',
  semestre: '',
  motivacion: '',
  aceptaTerminos: false,
};

interface RegistrationModalProps {
  semilleroId: number | null;
  semilleroNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const state = (n: number) => {
    if (n < current) return 'completed';
    if (n === current) return 'active';
    return '';
  };

  return (
    <div className="step-indicator">
      {[
        { n: 1, label: 'Semillero' },
        { n: 2, label: 'Datos Personales' },
        { n: 3, label: 'Confirmación' },
      ].map(({ n, label }) => (
        <div key={n} className={`step ${state(n)}`}>
          <div className="step-number">
            {n < current ? <i className="bi bi-check"></i> : n}
          </div>
          <div className="step-label small">{label}</div>
          {n < 3 && <div className="step-line"></div>}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RegistrationModal({
  semilleroId,
  semilleroNombre,
  isOpen,
  onClose,
}: RegistrationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Modal | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<InscripcionFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<InscripcionFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Bootstrap Modal setup
  useEffect(() => {
    if (!modalRef.current) return;
    instanceRef.current = new Modal(modalRef.current, { backdrop: 'static' });
    modalRef.current.addEventListener('hidden.bs.modal', () => {
      setStep(1);
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
      onClose();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!instanceRef.current) return;
    if (isOpen) {
      setStep(1);
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
      instanceRef.current.show();
    } else {
      instanceRef.current.hide();
    }
  }, [isOpen]);

  // ── Field helpers ───────────────────────────────────────────────────────────
  const set = (field: keyof InscripcionFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldClass = (field: keyof InscripcionFormData) =>
    `form-control${errors[field] ? ' is-invalid' : ''}`;

  const selectClass = (field: keyof InscripcionFormData) =>
    `form-select${errors[field] ? ' is-invalid' : ''}`;

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: InscripcionFormErrors = {};

    if (!form.nombres.trim()) newErrors.nombres = 'Campo requerido';
    if (!form.apellidos.trim()) newErrors.apellidos = 'Campo requerido';
    if (!form.cedula.trim() || !/^\d{7,10}$/.test(form.cedula))
      newErrors.cedula = 'Ingrese una cédula válida (7-10 dígitos)';
    if (!form.correo.trim() || !form.correo.endsWith('@udea.edu.co'))
      newErrors.correo = 'Debe ser un correo institucional @udea.edu.co';
    if (!form.telefono.trim() || !/^\d{10}$/.test(form.telefono))
      newErrors.telefono = 'Ingrese un teléfono válido (10 dígitos)';
    if (!form.programa.trim()) newErrors.programa = 'Campo requerido';
    if (!form.semestre) newErrors.semestre = 'Seleccione un semestre';
    if (!form.motivacion.trim()) newErrors.motivacion = 'Campo requerido';
    if (!form.aceptaTerminos) newErrors.aceptaTerminos = 'Debe aceptar los términos';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async function handleNext() {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!validate()) return;
      if (semilleroId == null) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        await submitInscripcion(semilleroId, form);
        setStep(3);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Error al enviar la inscripción.');
      } finally {
        setSubmitting(false);
      }
    } else {
      instanceRef.current?.hide();
    }
  }

  function handlePrev() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function handleCancel() {
    instanceRef.current?.hide();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content modal-udea">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>Inscripción al Semillero
            </h5>
            {step !== 3 && (
              <button type="button" className="btn-close" onClick={handleCancel}></button>
            )}
          </div>

          <div className="modal-body">
            {/* ── Step 1 ── */}
            {step === 1 && (
              <div>
                <StepIndicator current={1} />
                <h5 className="mb-3">{semilleroNombre}</h5>
                <div
                  className="alert alert-info"
                  style={{
                    background: 'rgba(0, 181, 173, 0.1)',
                    borderColor: 'var(--udea-turquesa)',
                    color: 'var(--udea-verde-oscuro)',
                  }}
                >
                  <i className="bi bi-info-circle me-2"></i>
                  Estás a punto de solicitar tu inscripción al semillero mostrado. El coordinador
                  del semillero revisará tu solicitud y se pondrá en contacto contigo.
                </div>
                <div className="mt-4">
                  <h6 className="mb-3">Requisitos para inscripción:</h6>
                  <ul>
                    <li>Tener interés en participar en un semillero de investigación</li>
                    <li>Disponibilidad para asistir a reuniones periódicas</li>
                    <li>Compromiso con el desarrollo de actividades investigativas</li>
                    <li>
                      La solicitud será enviada al coordinador del semillero para validación
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div>
                <StepIndicator current={2} />
                {submitError && (
                  <div className="alert alert-danger mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {submitError}
                  </div>
                )}
                <form noValidate>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className={fieldClass('nombres')}
                        placeholder="Ej: María Camila"
                        value={form.nombres}
                        onChange={(e) => set('nombres', e.target.value)}
                      />
                      {errors.nombres && (
                        <div className="invalid-feedback d-block">{errors.nombres}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        className={fieldClass('apellidos')}
                        placeholder="Ej: Gómez Restrepo"
                        value={form.apellidos}
                        onChange={(e) => set('apellidos', e.target.value)}
                      />
                      {errors.apellidos && (
                        <div className="invalid-feedback d-block">{errors.apellidos}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Número de cédula *</label>
                      <input
                        type="text"
                        className={fieldClass('cedula')}
                        placeholder="Ingrese su número de cédula"
                        value={form.cedula}
                        onChange={(e) => set('cedula', e.target.value)}
                      />
                      <small className="form-text text-muted">Solo números, sin puntos ni comas</small>
                      {errors.cedula && (
                        <div className="invalid-feedback d-block">{errors.cedula}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Correo institucional *</label>
                      <input
                        type="email"
                        className={fieldClass('correo')}
                        placeholder="usuario@udea.edu.co"
                        value={form.correo}
                        onChange={(e) => set('correo', e.target.value)}
                      />
                      <small className="form-text text-muted">Debe ser correo institucional</small>
                      {errors.correo && (
                        <div className="invalid-feedback d-block">{errors.correo}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono de contacto *</label>
                      <input
                        type="tel"
                        className={fieldClass('telefono')}
                        placeholder="Ej: 3001234567"
                        value={form.telefono}
                        onChange={(e) => set('telefono', e.target.value)}
                      />
                      {errors.telefono && (
                        <div className="invalid-feedback d-block">{errors.telefono}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Programa académico *</label>
                      <input
                        type="text"
                        className={fieldClass('programa')}
                        placeholder="Ej: Administración de Empresas"
                        value={form.programa}
                        onChange={(e) => set('programa', e.target.value)}
                      />
                      {errors.programa && (
                        <div className="invalid-feedback d-block">{errors.programa}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Semestre actual *</label>
                      <select
                        className={selectClass('semestre')}
                        value={form.semestre}
                        onChange={(e) => set('semestre', e.target.value)}
                      >
                        <option value="">Seleccione semestre</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <option key={n} value={String(n)}>
                            {n}° Semestre
                          </option>
                        ))}
                        <option value="10">10° Semestre o más</option>
                      </select>
                      {errors.semestre && (
                        <div className="invalid-feedback d-block">{errors.semestre}</div>
                      )}
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">Motivación para unirse al semillero *</label>
                      <textarea
                        className={fieldClass('motivacion')}
                        rows={3}
                        placeholder="Explique brevemente por qué desea unirse a este semillero, sus intereses investigativos y expectativas..."
                        value={form.motivacion}
                        onChange={(e) => set('motivacion', e.target.value)}
                      />
                      {errors.motivacion && (
                        <div className="invalid-feedback d-block">{errors.motivacion}</div>
                      )}
                    </div>

                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className={`form-check-input${errors.aceptaTerminos ? ' is-invalid' : ''}`}
                          type="checkbox"
                          id="aceptaTerminos"
                          checked={form.aceptaTerminos}
                          onChange={(e) => set('aceptaTerminos', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="aceptaTerminos">
                          Autorizo el tratamiento de mis datos personales según la Política de
                          Protección de Datos de la Universidad de Antioquia y acepto que mi
                          solicitud será enviada al coordinador del semillero para su validación.
                        </label>
                        {errors.aceptaTerminos && (
                          <div className="invalid-feedback d-block">{errors.aceptaTerminos}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div>
                <StepIndicator current={3} />
                <div className="text-center py-4">
                  <i
                    className="bi bi-envelope-check-fill"
                    style={{ fontSize: '4rem', color: 'var(--udea-verde-medio)' }}
                  ></i>
                  <h4 className="my-3">¡Solicitud de inscripción enviada!</h4>
                  <p className="mb-4">
                    Tu solicitud ha sido registrada exitosamente y ha sido enviada al{' '}
                    <strong>coordinador del semillero</strong> para su revisión y validación.
                  </p>
                  <div
                    className="alert alert-info"
                    style={{
                      background: 'rgba(124, 150, 64, 0.1)',
                      borderColor: 'var(--udea-verde-medio)',
                      color: 'var(--udea-verde-oscuro)',
                    }}
                  >
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Proceso de validación:</strong>
                    <br />
                    1. Tu solicitud llegará al correo del coordinador del semillero.
                    <br />
                    2. El coordinador revisará tu información y perfil.
                    <br />
                    3. Recibirás una confirmación formal por correo electrónico.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer buttons ── */}
          <div className="modal-footer registration-footer">
            {step > 1 && step < 3 && (
              <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                <i className="bi bi-arrow-left me-1"></i>Anterior
              </button>
            )}
            {step < 3 && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
            )}
            <button
              type="button"
              className="btn btn-udea"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting && (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              )}
              {step < 3 ? (
                <>
                  Siguiente <i className="bi bi-arrow-right ms-1"></i>
                </>
              ) : (
                'Cerrar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
