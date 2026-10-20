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
  useParams,
} from 'react-router-dom'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import Noticias from '../components/Noticias.jsx'

import { noticias } from '../data/noticias.js'

vi.mock('../data/noticias.js', () => ({
  noticias: [],
}))

const noticiasPrueba = [
  {
    id: 101,
    categoria: 'Radio',
    titulo: 'Nueva programación de prueba',
    resumen: 'Conoce los nuevos espacios de la radio.',
    fecha: '18 de octubre de 2026',
  },
  {
    id: 202,
    categoria: 'Comunidad',
    titulo: 'Encuentro de oyentes de prueba',
    resumen: 'Compartimos las actividades de la comunidad.',
    fecha: '19 de octubre de 2026',
  },
]

function DetalleDePrueba() {
  const { noticiaId } = useParams()

  return (
    <h1>
      Detalle de noticia {noticiaId}
    </h1>
  )
}

function montarNoticias() {
  render(
    <MemoryRouter
      initialEntries={['/app/noticias']}
    >
      <Routes>
        <Route
          path="/app/noticias"
          element={<Noticias />}
        />

        <Route
          path="/app/noticias/:noticiaId"
          element={<DetalleDePrueba />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Noticias', () => {
  beforeEach(() => {
    noticias.splice(
      0,
      noticias.length,
      ...noticiasPrueba,
    )
  })

  it('muestra el encabezado y todas las noticias con sus datos y enlaces', () => {
    montarNoticias()

    expect(
      screen.getByRole('heading', {
        name: 'Noticias',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Todo lo que pasa dentro y fuera de la radio.',
      ),
    ).toBeInTheDocument()

    const tarjetas = screen.getAllByRole('article')

    expect(tarjetas).toHaveLength(
      noticiasPrueba.length,
    )

    noticiasPrueba.forEach((noticia, indice) => {
      const tarjeta = within(tarjetas[indice])

      expect(
        tarjeta.getByRole('heading', {
          name: noticia.titulo,
          level: 2,
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByText(noticia.categoria, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByText(noticia.resumen, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByText(noticia.fecha, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        tarjeta.getByRole('link', {
          name: 'Leer más',
          exact: true,
        }),
      ).toHaveAttribute(
        'href',
        `/app/noticias/${noticia.id}`,
      )
    })

    expect(
      screen.queryByText(
        'No hay noticias disponibles por el momento.',
      ),
    ).not.toBeInTheDocument()
  })

  it('muestra el mensaje correspondiente cuando el listado está vacío', () => {
    noticias.splice(0, noticias.length)

    montarNoticias()

    expect(
      screen.getByText(
        'No hay noticias disponibles por el momento.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('link', {
        name: 'Leer más',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('navega al detalle de la noticia seleccionada al pulsar Leer más', async () => {
    const usuario = userEvent.setup()

    montarNoticias()

    const tarjetas = screen.getAllByRole('article')

    const segundaNoticia = within(tarjetas[1])

    await usuario.click(
      segundaNoticia.getByRole('link', {
        name: 'Leer más',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Detalle de noticia 202',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Noticias',
        level: 1,
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })
})