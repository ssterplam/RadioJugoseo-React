import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  MemoryRouter,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import Programas from '../components/Programas.jsx'

import {
  cargarCatalogoProgramas,
} from '../utils/programasStorage.js'

import {
  programacionSemanal,
} from '../data/programas.js'

vi.mock('../utils/programasStorage.js', () => ({
  cargarCatalogoProgramas: vi.fn(),
}))

const programasPrueba = [
  {
    id: 'programa-uno',
    nombre: 'Mañana de prueba',
    descripcion: 'Música y conversación para comenzar el día.',
    imagen: 'programa-uno.jpg',
  },
  {
    id: 'programa-dos',
    nombre: 'Tarde de prueba',
    descripcion: 'Una selección musical para la tarde.',
    imagen: 'programa-dos.jpg',
  },
]

function DetalleDePrueba() {
  const { programaId } = useParams()

  return (
    <h1>
      Detalle del programa {programaId}
    </h1>
  )
}

function montarProgramas() {
  render(
    <MemoryRouter
      initialEntries={['/app/programas']}
    >
      <Routes>
        <Route
          path="/app/programas"
          element={<Programas />}
        />

        <Route
          path="/app/programas/:programaId"
          element={<DetalleDePrueba />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Programas', () => {
  beforeEach(() => {
    cargarCatalogoProgramas.mockReset()

    cargarCatalogoProgramas.mockReturnValue({
      programas: programasPrueba,
      error: '',
    })
  })

  it('muestra el encabezado y las tarjetas con sus datos y enlaces', () => {
    montarProgramas()

    expect(
      screen.getByRole('heading', {
        name: 'Programas',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Conoce a los conductores y horarios de Jugoseo.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('img'),
    ).toHaveLength(programasPrueba.length)

    for (const programa of programasPrueba) {
      const imagen = screen.getByRole('img', {
        name: programa.nombre,
        exact: true,
      })

      expect(imagen).toHaveAttribute(
        'src',
        `${import.meta.env.BASE_URL}img/${programa.imagen}`,
      )

      expect(imagen).toHaveAttribute(
        'loading',
        'lazy',
      )

      const tarjeta = within(
        imagen.closest('.jugoseo-card'),
      )

      expect(
        tarjeta.getByText(programa.nombre, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByText(
          programa.descripcion,
          { exact: true },
        ),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByRole('link', {
          name: 'Ir al Programa',
          exact: true,
        }),
      ).toHaveAttribute(
        'href',
        `/app/programas/${programa.id}`,
      )
    }

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('renderiza los encabezados y todas las filas de la programación semanal', () => {
    montarProgramas()

    expect(
      screen.getByRole('heading', {
        name: 'Programación semanal',
        exact: true,
      }),
    ).toBeInTheDocument()

    const tabla = within(
      screen.getByRole('table'),
    )

    for (const nombre of [
      'Horario',
      'Lunes a viernes',
      'Sábado',
      'Domingo',
    ]) {
      expect(
        tabla.getByRole('columnheader', {
          name: nombre,
          exact: true,
        }),
      ).toBeInTheDocument()
    }

    const filas = tabla.getAllByRole('row')

    expect(filas).toHaveLength(
      programacionSemanal.length + 1,
    )

    programacionSemanal.forEach(
      (fila, indice) => {
        const celdas = within(
          filas[indice + 1],
        ).getAllByRole('cell')

        expect(
          celdas.map((celda) =>
            celda.textContent.trim(),
          ),
        ).toEqual([
          fila.horario,
          fila.semana,
          fila.sabado,
          fila.domingo,
        ])
      },
    )
  })

  it('muestra el mensaje de catálogo vacío y conserva la programación semanal', () => {
    cargarCatalogoProgramas.mockReturnValue({
      programas: [],
      error: '',
    })

    montarProgramas()

    expect(
      screen.getByText(
        'No hay programas disponibles por el momento.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('link', {
        name: 'Ir al Programa',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('img'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('table'),
    ).toBeInTheDocument()
  })

  it('muestra el error de carga sin renderizar el catálogo ni la tabla', () => {
    cargarCatalogoProgramas.mockReturnValue({
      programas: [],
      error: 'No se pudo cargar el catálogo de prueba.',
    })

    montarProgramas()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar el catálogo de prueba.',
    )

    expect(
      screen.queryByRole('table'),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('link', {
        name: 'Ir al Programa',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText(
        'No hay programas disponibles por el momento.',
      ),
    ).not.toBeInTheDocument()
  })

  it('navega al detalle del programa seleccionado', async () => {
    const usuario = userEvent.setup()

    montarProgramas()

    const imagen = screen.getByRole('img', {
      name: 'Tarde de prueba',
      exact: true,
    })

    const tarjeta = within(
      imagen.closest('.jugoseo-card'),
    )

    await usuario.click(
      tarjeta.getByRole('link', {
        name: 'Ir al Programa',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Detalle del programa programa-dos',
        exact: true,
      }),
    ).toBeInTheDocument()
  })

  it('oculta una imagen que falla sin quitar los datos del programa', () => {
    montarProgramas()

    const imagen = screen.getByRole('img', {
      name: 'Mañana de prueba',
      exact: true,
    })

    const tarjeta = within(
      imagen.closest('.jugoseo-card'),
    )

    fireEvent.error(imagen)

    expect(imagen).toHaveStyle({
      display: 'none',
    })

    expect(
      tarjeta.getByText('Mañana de prueba', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      tarjeta.getByRole('link', {
        name: 'Ir al Programa',
        exact: true,
      }),
    ).toBeInTheDocument()
  })
})