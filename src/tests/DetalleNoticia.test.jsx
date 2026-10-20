import {
  render,
  screen,
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

import DetalleNoticia from '../components/DetalleNoticia.jsx'

import { noticias } from '../data/noticias.js'

vi.mock('../data/noticias.js', () => ({
  noticias: [],
}))

const noticiasPrueba = [
  {
    id: 'noticia-primera',
    categoria: 'Radio',
    titulo: 'Primera noticia de prueba',
    fecha: '18 de octubre de 2026',
    parrafos: [
      'Contenido de la primera noticia.',
    ],
  },
  {
    id: 'noticia-segunda',
    categoria: 'Comunidad',
    titulo: 'Segunda noticia de prueba',
    fecha: '19 de octubre de 2026',
    parrafos: [
      'Primer párrafo de la segunda noticia.',
      'Segundo párrafo de la segunda noticia.',
    ],
  },
]

function montarDetalle(
  noticiaId = 'noticia-segunda',
) {
  render(
    <MemoryRouter
      initialEntries={[
        `/app/noticias/${noticiaId}`,
      ]}
    >
      <Routes>
        <Route
          path="/app/noticias"
          element={
            <h1>Listado de noticias de prueba</h1>
          }
        />

        <Route
          path="/app/noticias/:noticiaId"
          element={<DetalleNoticia />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetalleNoticia', () => {
  beforeEach(() => {
    noticias.splice(
      0,
      noticias.length,
      ...noticiasPrueba,
    )

    vi.spyOn(window, 'scrollTo')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra la noticia correspondiente al identificador y desplaza la página al inicio', () => {
    montarDetalle('noticia-segunda')

    expect(
      screen.getByRole('heading', {
        name: 'Segunda noticia de prueba',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Comunidad', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        '19 de octubre de 2026',
        { exact: true },
      ),
    ).toBeInTheDocument()

    for (
      const parrafo of noticiasPrueba[1].parrafos
    ) {
      expect(
        screen.getByText(parrafo, {
          exact: true,
        }),
      ).toBeInTheDocument()
    }

    expect(
      screen.queryByRole('heading', {
        name: 'Primera noticia de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /Volver a Noticias/,
      }),
    ).toHaveAttribute(
      'href',
      '/app/noticias',
    )

    expect(
      window.scrollTo,
    ).toHaveBeenCalledWith(0, 0)
  })

  it('muestra la pantalla de noticia no encontrada cuando el identificador no existe', () => {
    montarDetalle('noticia-inexistente')

    expect(
      screen.getByRole('heading', {
        name: 'Noticia no encontrada',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'La noticia solicitada no está disponible.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /Volver a Noticias/,
      }),
    ).toHaveAttribute(
      'href',
      '/app/noticias',
    )
  })

  it.each([
    {
      caso: 'una noticia existente',
      id: 'noticia-segunda',
    },
    {
      caso: 'una noticia inexistente',
      id: 'noticia-inexistente',
    },
  ])(
    'permite volver al listado desde $caso',
    async ({ id }) => {
      const usuario = userEvent.setup()

      montarDetalle(id)

      await usuario.click(
        screen.getByRole('link', {
          name: /Volver a Noticias/,
        }),
      )

      expect(
        await screen.findByRole('heading', {
          name: 'Listado de noticias de prueba',
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole('link', {
          name: /Volver a Noticias/,
        }),
      ).not.toBeInTheDocument()
    },
  )
})