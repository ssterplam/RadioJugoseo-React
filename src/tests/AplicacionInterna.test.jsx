import {
  render,
  screen,
  within,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import AplicacionInterna from '../components/AplicacionInterna.jsx'

import {
  eliminarSesion,
} from '../data/sesion.js'

vi.mock('../data/sesion.js', () => ({
  eliminarSesion: vi.fn(),
}))

vi.mock('../components/MenuPrincipal.jsx', () => ({
  default: function MenuPrincipalSimulado({
    sesion,
    cerrarSesion,
  }) {
    return (
      <nav aria-label="Menú de prueba">
        <p>Usuario recibido: {sesion.usuario}</p>
        <p>Rol recibido: {sesion.rol}</p>

        <button
          type="button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </nav>
    )
  },
}))

const sesionPrueba = {
  usuario: 'Ana Pérez',
  correo: 'ana@gmail.com',
  rol: 'Cliente',
}

function MarcoConSesion() {
  return (
    <Outlet
      context={{
        sesion: sesionPrueba,
      }}
    />
  )
}

function montarAplicacion() {
  render(
    <MemoryRouter
      initialEntries={['/app/inicio']}
    >
      <Routes>
        <Route
          path="/"
          element={<h1>Portada de prueba</h1>}
        />

        <Route element={<MarcoConSesion />}>
          <Route
            path="/app"
            element={<AplicacionInterna />}
          >
            <Route
              path="inicio"
              element={
                <h1>Contenido interno de prueba</h1>
              }
            />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AplicacionInterna', () => {
  beforeEach(() => {
    eliminarSesion.mockReset()
    eliminarSesion.mockReturnValue(true)
  })

  it('entrega la sesión al menú y muestra el contenido de la ruta hija', () => {
    montarAplicacion()

    const menu = screen.getByRole('navigation', {
      name: 'Menú de prueba',
      exact: true,
    })

    expect(
      within(menu).getByText(
        'Usuario recibido: Ana Pérez',
      ),
    ).toBeInTheDocument()

    expect(
      within(menu).getByText(
        'Rol recibido: Cliente',
      ),
    ).toBeInTheDocument()

    const contenido = screen.getByRole('main')

    expect(
      within(contenido).getByRole('heading', {
        name: 'Contenido interno de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()

    expect(
      eliminarSesion,
    ).not.toHaveBeenCalled()
  })

  it('solicita eliminar la sesión y navega a la portada cuando tiene éxito', async () => {
    const usuario = userEvent.setup()

    montarAplicacion()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar sesión',
        exact: true,
      }),
    )

    expect(
      eliminarSesion,
    ).toHaveBeenCalledTimes(1)

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido interno de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('muestra un error y conserva la pantalla cuando no se puede eliminar la sesión', async () => {
    const usuario = userEvent.setup()

    eliminarSesion.mockReturnValue(false)

    montarAplicacion()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar sesión',
        exact: true,
      }),
    )

    expect(
      eliminarSesion,
    ).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo eliminar la sesión. Revisa el almacenamiento del navegador.',
    )

    expect(
      screen.getByRole('heading', {
        name: 'Contenido interno de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })
})