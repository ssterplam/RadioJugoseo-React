import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import {
  MemoryRouter,
  Route,
  Routes,
  useOutletContext,
} from 'react-router-dom'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import RutaProtegida from '../components/RutaProtegida.jsx'

import { leerSesion } from '../data/sesion.js'

import {
  CLAVE_USUARIOS,
  EVENTO_USUARIOS,
} from '../utils/cuentasLectura.js'

vi.mock('../data/sesion.js', () => ({
  leerSesion: vi.fn(),
}))

const sesionPrueba = {
  usuario: 'Ana Pérez',
  correo: 'ana@gmail.com',
  rol: 'Cliente',
}

function ContenidoProtegido() {
  const { sesion } = useOutletContext()

  return (
    <section>
      <h1>Contenido protegido</h1>
      <p>Sesión: {sesion.usuario}</p>
    </section>
  )
}

function montarRuta() {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <Routes>
        <Route
          path="/"
          element={<h1>Portada de prueba</h1>}
        />

        <Route element={<RutaProtegida />}>
          <Route
            path="/privado"
            element={<ContenidoProtegido />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RutaProtegida', () => {
  beforeEach(() => {
    leerSesion.mockReset()
    leerSesion.mockReturnValue(sesionPrueba)
  })

  it('redirige a la portada cuando no existe una sesión válida', async () => {
    leerSesion.mockReturnValue(null)

    montarRuta()

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido protegido',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('permite el acceso y entrega la sesión mediante el contexto', () => {
    montarRuta()

    expect(
      screen.getByRole('heading', {
        name: 'Contenido protegido',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Sesión: Ana Pérez'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it.each([
    'focus',
    EVENTO_USUARIOS,
  ])(
    'revisa la sesión ante el evento %s y redirige si dejó de ser válida',
    async (nombreEvento) => {
      montarRuta()

      expect(
        screen.getByRole('heading', {
          name: 'Contenido protegido',
          exact: true,
        }),
      ).toBeInTheDocument()

      leerSesion.mockReturnValue(null)

      fireEvent(
        window,
        new Event(nombreEvento),
      )

      expect(
        await screen.findByRole('heading', {
          name: 'Portada de prueba',
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole('heading', {
          name: 'Contenido protegido',
          exact: true,
        }),
      ).not.toBeInTheDocument()
    },
  )

  it('ignora claves ajenas y revisa la sesión ante cambios relevantes de almacenamiento', async () => {
    montarRuta()

    const llamadasIniciales = leerSesion.mock.calls.length

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'otraClave',
      }),
    )

    expect(leerSesion).toHaveBeenCalledTimes(
      llamadasIniciales,
    )

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: CLAVE_USUARIOS,
      }),
    )

    expect(leerSesion).toHaveBeenCalledTimes(
      llamadasIniciales + 1,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Contenido protegido',
        exact: true,
      }),
    ).toBeInTheDocument()

    leerSesion.mockReturnValue(null)

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: null,
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()
  })
})