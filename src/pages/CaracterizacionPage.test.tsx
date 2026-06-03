import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CaracterizacionPage from './CaracterizacionPage';
import * as api from '../api/semillerosApi';

vi.mock('../api/semillerosApi', () => ({
  finalizarCaracterizacion: vi.fn(),
  getAreasOcde: vi.fn(),
  getPestanaActividades: vi.fn(),
  getPestanaDofa: vi.fn(),
  getPestanaGeneral: vi.fn(),
  getPestanaOds: vi.fn(),
  getPestanaOrganizacion: vi.fn(),
  getPestanaProduccion: vi.fn(),
  getPestanaRelacionamiento: vi.fn(),
  getSemilleroCoordinadorById: vi.fn(),
  getCampus: vi.fn(),
  getUnidades: vi.fn(),
  guardarPestanaActividades: vi.fn(),
  guardarPestanaDofa: vi.fn(),
  guardarPestanaGeneral: vi.fn(),
  guardarPestanaOds: vi.fn(),
  guardarPestanaOrganizacion: vi.fn(),
  guardarPestanaProduccion: vi.fn(),
  guardarPestanaRelacionamiento: vi.fn(),
}));

const semillero = {
  id: 1,
  codigo: 'SEM-UDEA-0001',
  nombre: 'Semillero IA',
  siglas: 'SIA',
  correoSemillero: 'sia@udea.edu.co',
  telefono: '3001234567',
  anioCreacion: 2024,
  mision: 'Misión del semillero',
  vision: 'Visión del semillero',
  objetivo: 'Objetivo del semillero',
  lineasInvestigacion: 'IA',
  palabrasClave: 'datos',
  grupoInvestigacion: 'Grupo IA',
  estado: 'BORRADOR',
  estadoCaracterizacion: 'GENERAL_COMPLETADO',
  facultad: 'Ingeniería',
  campus: 'Ciudad Universitaria',
  areaOcde: 'Ingeniería y Tecnología',
  fechaCreacion: null,
  fechaActualizacion: null,
};

function mockInitialLoad() {
  vi.mocked(api.getSemilleroCoordinadorById).mockResolvedValue(semillero);
  vi.mocked(api.getPestanaGeneral).mockResolvedValue({
    id: 1,
    codigo: 'SEM-UDEA-0001',
    nombre: 'Semillero IA',
    siglas: 'SIA',
    correoSemillero: 'sia@udea.edu.co',
    telefono: '3001234567',
    anioCreacion: 2024,
    mision: 'Misión del semillero',
    vision: 'Visión del semillero',
    objetivo: 'Objetivo del semillero',
    lineasInvestigacion: 'IA',
    palabrasClave: 'datos',
    grupoInvestigacion: 'Grupo IA',
    idUnidadAcademica: 1,
    nombreUnidad: 'Ingeniería',
    idCampus: 1,
    nombreCampus: 'Ciudad Universitaria',
    idAreaOcde: 2,
    nombreAreaOcde: 'Ingeniería y Tecnología',
    estadoCaracterizacion: 'GENERAL_COMPLETADO',
  });
  vi.mocked(api.getPestanaProduccion).mockResolvedValue({
    tienenArticulos: false,
    cantidadArticulos: 0,
    tienenLibros: false,
    cantidadLibros: 0,
    organizanEventos: false,
    cantidadEventos: 0,
    participaEnEventos: false,
    cantidadParticipaciones: 0,
  });
  vi.mocked(api.getPestanaOrganizacion).mockResolvedValue({
    recursosSeleccionados: [],
    fuentesSeleccionadas: [],
    todosLosRecursos: [{ id: 1, nombre: 'Laboratorio', siglas: '' }],
    todasLasFuentes: [{ id: 1, nombre: 'Sin financiación', siglas: '' }],
  });
  vi.mocked(api.getPestanaRelacionamiento).mockResolvedValue({
    adscritoGrupo: false,
    grupoInvestigacion: '',
    relacionGrupo: '',
    centroInvestigaciones: '',
    relacionCentro: '',
    departamento: '',
    relacionDepartamento: '',
    facultad: '',
    relacionFacultad: '',
  });
  vi.mocked(api.getPestanaActividades).mockResolvedValue({
    actividades: [{ idActividad: 1, nombre: 'Seminarios', categoria: 'Formativas', realiza: false }],
  });
  vi.mocked(api.getPestanaDofa).mockResolvedValue({
    fortalezas: 'Fortalezas suficientes',
    debilidades: 'Debilidades suficientes',
    oportunidades: 'Oportunidades suficientes',
    amenazas: 'Amenazas suficientes',
  });
  vi.mocked(api.getPestanaOds).mockResolvedValue({
    idAreaOcde: 2,
    nombreAreaOcde: 'Ingeniería y Tecnología',
    subAreaOcde: 'Computación',
    idOdsPrincipal: 9,
    nombreOdsPrincipal: 'Industria, innovación e infraestructura',
    observacionesFinales: '',
  });
  vi.mocked(api.getAreasOcde).mockResolvedValue([
    { id: 2, nombre: 'Ingeniería y Tecnología', siglas: '' },
  ]);
  vi.mocked(api.getUnidades).mockResolvedValue([
    { id: 1, nombre: 'Ingeniería', siglas: 'ING' },
  ]);
  vi.mocked(api.getCampus).mockResolvedValue([
    { id: 1, nombre: 'Ciudad Universitaria', siglas: '' },
  ]);
}

function renderPage() {
  render(
    <CaracterizacionPage
      token="token-test"
      correoCoordinador="carlos.hernandez@udea.edu.co"
      semilleroId={1}
      onBack={vi.fn()}
      onLogout={vi.fn()}
    />,
  );
}

describe('CaracterizacionPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockInitialLoad();
    vi.mocked(api.guardarPestanaProduccion).mockResolvedValue({
      ...semillero,
      estadoCaracterizacion: 'GENERAL_COMPLETADO,PRODUCCION_COMPLETADO',
    });
  });

  it('autoguarda silenciosamente la pestaña activa cada 2 minutos', async () => {
    let intervalHandler: TimerHandler | undefined;
    vi.spyOn(window, 'setInterval').mockImplementation((handler: TimerHandler) => {
      intervalHandler = handler;
      return 1;
    });
    renderPage();

    await screen.findByText('SEM-UDEA-0001');
    fireEvent.click(screen.getByRole('button', { name: /Producción/i }));

    await act(async () => {
      if (typeof intervalHandler === 'function') intervalHandler();
    });

    await waitFor(() => expect(api.guardarPestanaProduccion).toHaveBeenCalledTimes(1));
    expect(api.guardarPestanaProduccion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        tienenArticulos: false,
        cantidadArticulos: 0,
      }),
      'token-test',
    );
    expect(screen.getByText(/Autoguardado a las/i)).toBeInTheDocument();
  });

  it('permite cerrar un error global de guardado', async () => {
    renderPage();

    await screen.findByText('SEM-UDEA-0001');
    fireEvent.click(screen.getAllByRole('button', { name: /Organización/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Guardar y Continuar/i }));

    expect(await screen.findByText('Seleccione al menos un recurso o la opción Ninguna.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => {
      expect(screen.queryByText('Seleccione al menos un recurso o la opción Ninguna.')).not.toBeInTheDocument();
    });
  });
});
