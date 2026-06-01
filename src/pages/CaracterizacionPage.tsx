import { useEffect, useState } from 'react';
import type {
  CaracterizacionDraft,
  FiltroItem,
  GuardarGeneralPayload,
  PestanaGeneralResponse,
  SemilleroCoordinador,
} from '../types';
import {
  finalizarCaracterizacion,
  getAreasOcde,
  getPestanaActividades,
  getPestanaDofa,
  getPestanaGeneral,
  getPestanaOds,
  getPestanaOrganizacion,
  getPestanaProduccion,
  getPestanaRelacionamiento,
  getSemilleroCoordinadorById,
  guardarPestanaActividades,
  guardarPestanaDofa,
  guardarPestanaGeneral,
  guardarPestanaOds,
  guardarPestanaOrganizacion,
  guardarPestanaProduccion,
  guardarPestanaRelacionamiento,
} from '../api/semillerosApi';
import TabGeneral from '../components/caracterizacion/TabGeneral';
import TabProduccion from '../components/caracterizacion/TabProduccion';
import TabOrganizacion from '../components/caracterizacion/TabOrganizacion';
import TabRelacionamiento from '../components/caracterizacion/TabRelacionamiento';
import TabActividades from '../components/caracterizacion/TabActividades';
import TabDofa from '../components/caracterizacion/TabDofa';
import TabOds from '../components/caracterizacion/TabOds';

interface Props {
  token: string;
  correoCoordinador: string;
  semilleroId: number;
  onBack: () => void;
  onLogout: () => void;
}

const TABS = [
  { label: 'General', icon: '📋' },
  { label: 'Producción', icon: '📚' },
  { label: 'Organización', icon: '🏢' },
  { label: 'Relacionamiento', icon: '🤝' },
  { label: 'Actividades', icon: '🔬' },
  { label: 'DOFA', icon: '📊' },
  { label: 'ODS', icon: '🌍' },
];

const AUTO_SAVE_INTERVAL_MS = 120000;

const EMPTY_DRAFT: CaracterizacionDraft = {
  produccion: {
    tieneArticulos: '',
    cantArticulos: '',
    tieneLibros: '',
    cantLibros: '',
    organizaEventos: '',
    cantEventos: '',
    participaEventos: '',
    cantParticipaciones: '',
  },
  organizacion: {
    recursos: [],
    fuentes: [],
  },
  relacionamiento: {
    adscrito: '',
    grupo: '',
    relacionGrupo: '',
    centro: '',
    relacionCentro: '',
    departamento: '',
    relacionDept: '',
    facultad: '',
    relacionFacultad: '',
  },
  actividades: [],
  dofa: {
    fortalezas: '',
    debilidades: '',
    oportunidades: '',
    amenazas: '',
  },
  ods: {
    areaOcde: '',
    subArea: '',
    odsPrincipal: '',
    observaciones: '',
  },
};

function boolToSiNo(value?: boolean | null) {
  return value ? 'si' : 'no';
}

function siNoToBool(value: string) {
  return value === 'si';
}

function num(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function savedTabsFromEstado(estado?: string | null) {
  if (estado === 'COMPLETO') return new Set(TABS.map((_, index) => index));
  const markers = estado ? estado.split(',') : [];
  const tabMarkers = ['GENERAL', 'PRODUCCION', 'ORGANIZACION', 'RELACIONAMIENTO', 'ACTIVIDADES', 'DOFA', 'ODS'];
  return new Set(tabMarkers.flatMap((marker, index) => markers.includes(`${marker}_COMPLETADO`) ? [index] : []));
}

function formatSaveTime(date: Date) {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export default function CaracterizacionPage({
  token,
  correoCoordinador,
  semilleroId,
  onBack,
  onLogout,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [semillero, setSemillero] = useState<SemilleroCoordinador | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTabs, setSavedTabs] = useState<Set<number>>(new Set());
  const [finalizado, setFinalizado] = useState(false);
  const [finalizandoMsg, setFinalizandoMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<CaracterizacionDraft>(EMPTY_DRAFT);
  const [generalData, setGeneralData] = useState<PestanaGeneralResponse | null>(null);
  const [generalAutosavePayload, setGeneralAutosavePayload] = useState<GuardarGeneralPayload | null>(null);
  const [recursos, setRecursos] = useState<FiltroItem[]>([]);
  const [fuentes, setFuentes] = useState<FiltroItem[]>([]);
  const [areasOcde, setAreasOcde] = useState<FiltroItem[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadSemillero();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!semillero || loading || finalizado) return;
    const timer = window.setInterval(() => {
      void autoSaveCurrentTab();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeTab, draft, generalAutosavePayload, semillero, loading, finalizado]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateDraft<K extends keyof CaracterizacionDraft>(section: K, value: CaracterizacionDraft[K]) {
    setDraft(prev => ({ ...prev, [section]: value }));
  }

  async function loadSemillero() {
    setLoading(true);
    setError(null);
    setSavedTabs(new Set());
    setFinalizado(false);
    setFinalizandoMsg(null);
    try {
      const [
        s,
        general,
        produccion,
        organizacion,
        relacionamiento,
        actividades,
        dofa,
        ods,
        areas,
      ] = await Promise.all([
        getSemilleroCoordinadorById(semilleroId, token),
        getPestanaGeneral(semilleroId, token),
        getPestanaProduccion(semilleroId, token),
        getPestanaOrganizacion(semilleroId, token),
        getPestanaRelacionamiento(semilleroId, token),
        getPestanaActividades(semilleroId, token),
        getPestanaDofa(semilleroId, token),
        getPestanaOds(semilleroId, token),
        getAreasOcde(),
      ]);
      setSemillero(s);
      setGeneralData(general);
      setRecursos(organizacion.todosLosRecursos ?? []);
      setFuentes(organizacion.todasLasFuentes ?? []);
      setAreasOcde(areas);
      setDraft({
        produccion: {
          tieneArticulos: boolToSiNo(produccion.tienenArticulos),
          cantArticulos: String(produccion.cantidadArticulos ?? 0),
          tieneLibros: boolToSiNo(produccion.tienenLibros),
          cantLibros: String(produccion.cantidadLibros ?? 0),
          organizaEventos: boolToSiNo(produccion.organizanEventos),
          cantEventos: String(produccion.cantidadEventos ?? 0),
          participaEventos: boolToSiNo(produccion.participaEnEventos),
          cantParticipaciones: String(produccion.cantidadParticipaciones ?? 0),
        },
        organizacion: {
          recursos: (organizacion.recursosSeleccionados ?? []).map(item => item.id),
          fuentes: (organizacion.fuentesSeleccionadas ?? []).map(item => item.id),
        },
        relacionamiento: {
          adscrito: boolToSiNo(relacionamiento.adscritoGrupo),
          grupo: relacionamiento.grupoInvestigacion ?? '',
          relacionGrupo: relacionamiento.relacionGrupo ?? '',
          centro: relacionamiento.centroInvestigaciones ?? '',
          relacionCentro: relacionamiento.relacionCentro ?? '',
          departamento: relacionamiento.departamento ?? '',
          relacionDept: relacionamiento.relacionDepartamento ?? '',
          facultad: relacionamiento.facultad ?? '',
          relacionFacultad: relacionamiento.relacionFacultad ?? '',
        },
        actividades: (actividades.actividades ?? []).map(item => ({ ...item, realiza: Boolean(item.realiza) })),
        dofa: {
          fortalezas: dofa.fortalezas ?? '',
          debilidades: dofa.debilidades ?? '',
          oportunidades: dofa.oportunidades ?? '',
          amenazas: dofa.amenazas ?? '',
        },
        ods: {
          areaOcde: ods.idAreaOcde?.toString() ?? general.idAreaOcde?.toString() ?? '',
          subArea: ods.subAreaOcde ?? '',
          odsPrincipal: ods.idOdsPrincipal?.toString() ?? '',
          observaciones: ods.observacionesFinales ?? '',
        },
      });
      if (s.estadoCaracterizacion === 'COMPLETO') setFinalizado(true);
      setSavedTabs(savedTabsFromEstado(s.estadoCaracterizacion ?? general.estadoCaracterizacion));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la caracterización.');
    } finally {
      setLoading(false);
    }
  }

  // ── Tab 0 (General) → real API ────────────────────────────────────────────
  async function handleSaveGeneral(payload: GuardarGeneralPayload) {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await guardarPestanaGeneral(semillero.id, payload, token);
      setSemillero(updated);
      setGeneralData(prev => prev ? { ...prev, ...payload } : prev);
      setSavedTabs(prev => new Set([...prev, 0]));
      setActiveTab(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la pestaña General.');
    } finally {
      setSaving(false);
    }
  }

  async function autoSaveCurrentTab() {
    if (!semillero || saving || autoSaving || finalizado) return;
    setAutoSaving(true);
    setAutoSaveError(null);
    try {
      const updated = await saveTab(activeTab, { silent: true });
      if (updated) {
        setLastAutoSavedAt(new Date());
      }
    } catch (err) {
      setAutoSaveError(err instanceof Error ? err.message : 'No se pudo autoguardar esta pestaña.');
    } finally {
      setAutoSaving(false);
    }
  }

  async function saveTab(tabIndex: number, options?: { silent?: boolean; advance?: boolean }) {
    if (!semillero) return null;
    const silent = options?.silent ?? false;
    const advance = options?.advance ?? false;
    let updated: SemilleroCoordinador | null = null;

    if (!silent) setError(null);

    if (tabIndex === 0) {
      if (!generalAutosavePayload) return null;
      updated = await guardarPestanaGeneral(semillero.id, generalAutosavePayload, token);
      setGeneralData(prev => prev ? { ...prev, ...generalAutosavePayload } : prev);
    }

    if (tabIndex === 1) {
      updated = await guardarPestanaProduccion(semillero.id, {
        tienenArticulos: siNoToBool(draft.produccion.tieneArticulos),
        cantidadArticulos: num(draft.produccion.cantArticulos),
        tienenLibros: siNoToBool(draft.produccion.tieneLibros),
        cantidadLibros: num(draft.produccion.cantLibros),
        organizanEventos: siNoToBool(draft.produccion.organizaEventos),
        cantidadEventosOrganizados: num(draft.produccion.cantEventos),
        participaEnEventos: siNoToBool(draft.produccion.participaEventos),
        cantidadParticipaciones: num(draft.produccion.cantParticipaciones),
      }, token);
    }

    if (tabIndex === 2) {
      updated = await guardarPestanaOrganizacion(semillero.id, {
        idsRecursos: draft.organizacion.recursos,
        idsFuentesFinanciacion: draft.organizacion.fuentes,
      }, token);
    }

    if (tabIndex === 3) {
      updated = await guardarPestanaRelacionamiento(semillero.id, {
        adscritoGrupo: siNoToBool(draft.relacionamiento.adscrito),
        grupoInvestigacion: draft.relacionamiento.grupo.trim() || undefined,
        relacionGrupo: draft.relacionamiento.relacionGrupo.trim() || undefined,
        centroInvestigaciones: draft.relacionamiento.centro.trim() || undefined,
        relacionCentro: draft.relacionamiento.relacionCentro.trim() || undefined,
        departamento: draft.relacionamiento.departamento.trim() || undefined,
        relacionDepartamento: draft.relacionamiento.relacionDept.trim() || undefined,
        facultad: draft.relacionamiento.facultad.trim() || undefined,
        relacionFacultad: draft.relacionamiento.relacionFacultad.trim() || undefined,
      }, token);
    }

    if (tabIndex === 4) {
      if (draft.actividades.length === 0) return null;
      updated = await guardarPestanaActividades(semillero.id, {
        actividades: draft.actividades.map(item => ({
          idActividad: item.idActividad,
          realiza: item.realiza,
        })),
      }, token);
    }

    if (tabIndex === 5) {
      updated = await guardarPestanaDofa(semillero.id, draft.dofa, token);
    }

    if (tabIndex === 6) {
      const idAreaOcde = Number.parseInt(draft.ods.areaOcde, 10);
      const idOdsPrincipal = Number.parseInt(draft.ods.odsPrincipal, 10);
      if (!Number.isFinite(idAreaOcde) || !Number.isFinite(idOdsPrincipal)) return null;
      updated = await guardarPestanaOds(semillero.id, {
        idAreaOcde,
        subAreaOcde: draft.ods.subArea.trim() || undefined,
        idOdsPrincipal,
        observacionesFinales: draft.ods.observaciones.trim() || undefined,
      }, token);
    }

    if (!updated) return null;
    setSemillero(updated);
    setSavedTabs(prev => new Set([...prev, tabIndex]));
    if (advance && tabIndex < TABS.length - 1) setActiveTab(tabIndex + 1);
    return updated;
  }

  async function handleSaveProduccion() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(1, { advance: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar Producción.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrganizacion() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(2, { advance: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar Organización.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRelacionamiento() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(3, { advance: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar Relacionamiento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveActividades() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(4, { advance: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar Actividades.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDofa() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(5, { advance: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar DOFA.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOds() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    try {
      await saveTab(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar ODS.');
    } finally {
      setSaving(false);
    }
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
  async function handleFinalizar() {
    if (!semillero) return;
    setSaving(true);
    setError(null);
    setFinalizandoMsg(null);
    try {
      const result = await finalizarCaracterizacion(semillero.id, token);
      setSemillero(result);
      setFinalizado(true);
      setFinalizandoMsg('Caracterización finalizada. El administrador ha sido notificado por correo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar la caracterización.');
    } finally {
      setSaving(false);
    }
  }

  const canFinalizar = savedTabs.size === TABS.length && !finalizado;

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: 'var(--udea-verde-principal)', width: 48, height: 48 }}></div>
          <p className="text-muted">Cargando caracterización...</p>
        </div>
      </div>
    );
  }

  if (!semillero) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error ?? 'No se pudo cargar el semillero.'}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>Volver</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fcf9 0%, #eef5f1 100%)' }}>
      {/* Header */}
      <div className="udea-header" style={{ borderRadius: '0 0 12px 12px', marginBottom: 0, paddingBottom: '1rem' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="udea-logo mb-1" style={{ fontSize: '1.5rem' }}>UdeA <span>SIGSI</span></h1>
              <span className="sigsi-badge">CARACTERIZACIÓN DE SEMILLERO</span>
            </div>
            <div className="col-auto text-end">
              <div className="small text-white opacity-75 mb-1">
                <i className="bi bi-shield-check me-1"></i>{correoCoordinador}
              </div>
              <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                <i className="bi bi-box-arrow-left me-1"></i>Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: 960 }}>
        <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Mis semilleros
        </button>

        {/* Código del semillero */}
        <div className="d-flex align-items-center justify-content-between p-3 rounded mb-3 text-white fw-semibold"
          style={{ background: 'linear-gradient(135deg, var(--udea-verde-medio), var(--udea-verde-oscuro))' }}>
          <span><i className="bi bi-qr-code-scan me-2"></i>Código del semillero:</span>
          <span className="px-3 py-1 rounded fw-bold" style={{ background: 'white', color: 'var(--udea-verde-oscuro)', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 2 }}>
            {semillero.codigo}
          </span>
        </div>

        {/* Error global */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show py-2 small mb-3" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>{error}
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setError(null)}></button>
          </div>
        )}

        {(autoSaving || lastAutoSavedAt || autoSaveError) && (
          <div className="d-flex justify-content-end mb-2">
            <div className="small px-2 py-1 rounded"
              style={{ background: 'rgba(0, 181, 173, 0.10)', color: autoSaveError ? '#9b2c2c' : 'var(--udea-verde-oscuro)' }}>
              {autoSaving && (
                <>
                  <span className="spinner-border spinner-border-sm me-2" style={{ width: 12, height: 12 }}></span>
                  Autoguardando...
                </>
              )}
              {!autoSaving && autoSaveError && <>Autoguardado pendiente: {autoSaveError}</>}
              {!autoSaving && !autoSaveError && lastAutoSavedAt && <>Autoguardado a las {formatSaveTime(lastAutoSavedAt)}</>}
            </div>
          </div>
        )}

        {/* Finalizar success */}
        {finalizandoMsg && (
          <div className="alert py-2 small mb-3 fw-semibold text-center"
            style={{ background: 'rgba(0,181,173,0.12)', borderColor: 'var(--udea-turquesa)', color: 'var(--udea-verde-oscuro)' }}>
            <i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--udea-turquesa)' }}></i>
            {finalizandoMsg}
          </div>
        )}

        {/* Card con tabs */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
          {/* Tab navigation */}
          <div className="d-flex flex-wrap gap-1 p-2 pb-0" style={{ background: 'white', borderBottom: '3px solid var(--udea-verde-principal)' }}>
            {TABS.map((tab, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-sm fw-semibold"
                style={{
                  borderRadius: '8px 8px 0 0',
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  background: activeTab === i
                    ? 'linear-gradient(135deg, var(--udea-verde-principal), var(--udea-verde-oscuro))'
                    : 'var(--udea-gris-claro)',
                  color: activeTab === i ? 'white' : 'var(--udea-verde-oscuro)',
                  border: 'none',
                  position: 'relative',
                }}
                onClick={() => setActiveTab(i)}
              >
                {tab.icon} {tab.label}
                {savedTabs.has(i) && (
                  <span className="ms-1" style={{ color: activeTab === i ? 'rgba(255,255,255,0.9)' : 'var(--udea-verde-medio)', fontSize: '0.7rem' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Indicator */}
          <div className="px-3 py-1 small" style={{ background: 'var(--udea-gris-claro)', color: 'var(--udea-verde-oscuro)', fontWeight: 600 }}>
            <i className="bi bi-grid-3x3-gap-fill me-2"></i>
            Pestaña {activeTab + 1} de {TABS.length}
            {' · '}
            <span style={{ color: savedTabs.size > 0 ? 'var(--udea-verde-medio)' : undefined }}>
              {savedTabs.size}/{TABS.length} secciones guardadas
            </span>
            {finalizado && (
              <span className="ms-2 badge" style={{ background: 'var(--udea-turquesa)', color: 'white' }}>CARACTERIZADO ✓</span>
            )}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 0 && (
              <TabGeneral
                semillero={semillero}
                initialData={generalData}
                onDraftChange={setGeneralAutosavePayload}
                onSave={handleSaveGeneral}
                saving={saving}
              />
            )}
            {activeTab === 1 && (
              <TabProduccion
                value={draft.produccion}
                onChange={value => updateDraft('produccion', value)}
                onSave={handleSaveProduccion}
                onPrev={() => setActiveTab(0)}
                saving={saving}
              />
            )}
            {activeTab === 2 && (
              <TabOrganizacion
                value={draft.organizacion}
                recursos={recursos}
                fuentes={fuentes}
                onChange={value => updateDraft('organizacion', value)}
                onSave={handleSaveOrganizacion}
                onPrev={() => setActiveTab(1)}
                saving={saving}
              />
            )}
            {activeTab === 3 && (
              <TabRelacionamiento
                value={draft.relacionamiento}
                onChange={value => updateDraft('relacionamiento', value)}
                onSave={handleSaveRelacionamiento}
                onPrev={() => setActiveTab(2)}
                saving={saving}
              />
            )}
            {activeTab === 4 && (
              <TabActividades
                value={draft.actividades}
                onChange={value => updateDraft('actividades', value)}
                onSave={handleSaveActividades}
                onPrev={() => setActiveTab(3)}
                saving={saving}
              />
            )}
            {activeTab === 5 && (
              <TabDofa
                value={draft.dofa}
                onChange={value => updateDraft('dofa', value)}
                onSave={handleSaveDofa}
                onPrev={() => setActiveTab(4)}
                saving={saving}
              />
            )}
            {activeTab === 6 && (
              <TabOds
                value={draft.ods}
                areas={areasOcde}
                onChange={value => updateDraft('ods', value)}
                onSave={handleSaveOds}
                onPrev={() => setActiveTab(5)}
                saving={saving}
                onFinalizar={handleFinalizar}
                canFinalizar={canFinalizar}
                finalizado={finalizado}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
