import {
  render,
  screen,
  within,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import DetallePrograma from '../components/DetallePrograma.jsx'

import {
  cargarCatalogoProgramas,
} from '../utils/programasStorage.js'

vi.mock('../utils/programasStorage.js', () => ({
  cargarCatalogoProgramas: vi.fn(),
}))

const programasPrueba = [
  {
    id: 'programa-uno',
    nombre: 'Mañana de prueba',
    imagen: 'programa-uno.jpg',
    horarioDetalle: 'Lunes a viernes, 08:00 a 10:00',
    conductor: 'Ana Pérez',
    parrafos: [
      'Descripción del primer programa.',
    ],
    caracteristicas: [
      'Conversación matinal',
    ],
  },
  {
    id: 'programa-dos',
    nombre: 'Tarde de prueba',
    imagen: 'programa-dos.jpg',
    horarioDetalle: 'Lunes a viernes, 16:00 a 18:00',
    conductor: 'Pedro Soto',
    parrafos: [
      'Primer párrafo del segundo programa.',
      'Segundo párrafo del segundo programa.',
    ],
    caracteristicas: [
      'Selección musical',
      'Participación de oyentes',
    ],
  },
]

function montarDetalle(
  programaId = 'programa-dos',
) {
  render(
    <MemoryRouter
      initialEntries={[
        `/app/programas/${programaId}`,
      ]}
    >
      <Routes>
        <Route
          path="/app/programas"
          element={
            <h1>Listado de programas de prueba</h1>
          }
        />

        <Route
          path="/app/programas/:programaId"
          element={<DetallePrograma />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetallePrograma', () => {
  beforeEach(() => {
    cargarCatalogoProgramas.mockReset()

    cargarCatalogoProgramas.mockReturnValue({
      programas: programasPrueba,
      error: '',
    })

    vi.spyOn(window, 'scrollTo')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el programa seleccionado con sus datos, párrafos y características', () => {
    montarDetalle('programa-dos')

    const programa = programasPrueba[1]

    expect(
      screen.getByRole('heading', {
        name: programa.nombre,
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: programasPrueba[0].nombre,
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('img', {
        name: programa.nombre,
        exact: true,
      }),
    ).toHaveAttribute(
      'src',
      `${import.meta.env.BASE_URL}img/${programa.imagen}`,
    )

    expect(
      screen.getByText(
        programa.horarioDetalle,
        { exact: true },
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        `Con ${programa.conductor}`,
        { exact: true },
      ),
    ).toBeInTheDocument()

    for (const parrafo of programa.parrafos) {
      expect(
        screen.getByText(parrafo, {
          exact: true,
        }),
      ).toBeInTheDocument()
    }

    expect(
      screen.getByRole('heading', {
        name: 'Lo que puedes esperar',
        exact: true,
      }),
    ).toBeInTheDocument()

    const lista = within(
      screen.getByRole('list'),
    )

    expect(
      lista.getAllByRole('listitem'),
    ).toHaveLength(
      programa.caracteristicas.length,
    )

    for (
      const caracteristica of programa.caracteristicas
    ) {
      expect(
        lista.getByText(caracteristica, {
          exact: true,
        }),
      ).toBeInTheDocument()
    }

    expect(
      window.scrollTo,
    ).toHaveBeenCalledWith(0, 0)

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('muestra la pantalla alternativa cuando el programa no existe', () => {
    montarDetalle('programa-inexistente')

    expect(
      screen.getByRole('heading', {
        name: 'Programa no encontrado',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'El programa solicitado no está disponible.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('img'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /Volver a Programas/,
      }),
    ).toHaveAttribute(
      'href',
      '/app/programas',
    )
  })

  it('muestra el error de carga en lugar del detalle o del mensaje de programa inexistente', () => {
    cargarCatalogoProgramas.mockReturnValue({
      programas: [],
      error: 'No se pudo cargar el catálogo de prueba.',
    })

    montarDetalle()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar el catálogo de prueba.',
    )

    expect(
      screen.queryByRole('heading', {
        name: 'Programa no encontrado',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('img'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /Volver a Programas/,
      }),
    ).toHaveAttribute(
      'href',
      '/app/programas',
    )
  })

  it.each([
    {
      caso: 'un programa existente',
      id: 'programa-dos',
      error: '',
    },
    {
      caso: 'un programa inexistente',
      id: 'programa-inexistente',
      error: '',
    },
    {
      caso: 'un error de carga',
      id: 'programa-dos',
      error: 'Error de carga de prueba.',
    },
  ])(
    'permite volver al listado desde $caso',
    async ({ id, error }) => {
      const usuario = userEvent.setup()

      cargarCatalogoProgramas.mockReturnValue({
        programas: error ? [] : programasPrueba,
        error,
      })

      montarDetalle(id)

      await usuario.click(
        screen.getByRole('link', {
          name: /Volver a Programas/,
        }),
      )

      expect(
        await screen.findByRole('heading', {
          name: 'Listado de programas de prueba',
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole('link', {
          name: /Volver a Programas/,
        }),
      ).not.toBeInTheDocument()
    },
  )
})