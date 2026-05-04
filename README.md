# Portal de Semilleros de Investigación - UdeA

Frontend del portal de semilleros de la Universidad de Antioquia, desarrollado como parte del proyecto SIGSI (Sistema de Gestión de Semilleros de Investigación) de la Vicerrectoría de Investigación.

## ¿De qué trata esto?

Interfaz web con dos perfiles de uso:

- **Público general:** consulta los semilleros activos, ve sus detalles y solicita inscripción.
- **Coordinador de semillero:** inicia sesión y completa el proceso de caracterización de su semillero (7 pestañas).

## Tecnologías usadas

- **React 19** con **TypeScript**
- **Vite** como bundler
- **Bootstrap 5** para estilos y componentes
- **Bootstrap Icons** para íconos

## Estructura del proyecto

```
src/
├── api/
│   └── semillerosApi.ts         # Todas las llamadas al backend
├── types/
│   └── index.ts                 # Tipos compartidos
├── styles/
│   └── udea.css                 # Estilos corporativos UdeA
├── components/
│   ├── Header.tsx
│   ├── FiltersSection.tsx
│   ├── SemilleroCard.tsx
│   ├── SemilleroList.tsx
│   ├── DetailsModal.tsx
│   ├── RegistrationModal.tsx
│   ├── Footer.tsx
│   └── caracterizacion/         # Pestañas del flujo de caracterización
│       ├── TabGeneral.tsx
│       ├── TabOrganizacion.tsx
│       ├── TabProduccion.tsx
│       ├── TabActividades.tsx
│       ├── TabRelacionamiento.tsx
│       ├── TabOds.tsx
│       └── TabDofa.tsx
├── pages/
│   ├── HomePage.tsx             # Vista pública
│   ├── LoginPage.tsx            # Login coordinador (con captcha matemático)
│   └── CaracterizacionPage.tsx  # Flujo de caracterización (7 pestañas)
└── App.tsx                      # Enrutamiento por estado: home | login | caracterizacion
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Cambia la URL si el backend corre en otro host o puerto.

## Cómo correr el proyecto

> El backend debe estar corriendo antes de iniciar el frontend.

```bash
npm install
npm run dev
```

Abre el navegador en `http://localhost:5173`

Para el build de producción:

```bash
npm run build
```

## Endpoints del backend consumidos

### Públicos

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/api/v1/semilleros` | Listado paginado (`pagina`, `tamano`, `idUnidad`, `idCampus`, `idArea`, `q`) |
| `GET` | `/api/v1/semilleros/{id}` | Detalle de un semillero |
| `POST` | `/api/v1/inscripciones` | Enviar solicitud de inscripción |
| `GET` | `/api/v1/filtros/unidades-academicas` | Opciones del dropdown Unidad Académica |
| `GET` | `/api/v1/filtros/campus` | Opciones del dropdown Campus |
| `GET` | `/api/v1/filtros/areas-ocde` | Opciones del dropdown Área OCDE |

### Autenticación

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET` | `/api/v1/auth/captcha-math` | Obtener captcha matemático |
| `POST` | `/api/v1/auth/login` | Login coordinador (devuelve JWT) |

### Coordinador (requieren Bearer token)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/api/v1/coordinador/semilleros/iniciar` | Crear/iniciar caracterización |
| `GET` | `/api/v1/coordinador/semilleros/mi-semillero` | Obtener semillero del coordinador |
| `PATCH` | `/api/v1/coordinador/semilleros/{id}/pestana/general` | Guardar pestaña General |
| `POST` | `/api/v1/coordinador/semilleros/{id}/finalizar` | Finalizar caracterización |

## Funcionalidades

### Vista pública
- Listado paginado de semilleros con tarjetas
- Filtros por Unidad Académica, Área OCDE, Campus y búsqueda por texto
- Modal de detalles con toda la información del semillero
- Formulario de inscripción en 3 pasos con validación
- Estados de carga y error en todas las operaciones

### Vista coordinador
- Login con captcha matemático
- Flujo de caracterización en 7 pestañas: General, Organización, Producción, Actividades, Relacionamiento, ODS, DOFA
- El botón **Finalizar** se habilita solo al completar las 7 pestañas
- Logout y regreso a la vista pública
