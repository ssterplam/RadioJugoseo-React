import {
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

import RutaPorRol from '../components/RutaPorRol.jsx'

import { leerSesion } from '../data/sesion.js'

vi.mock('../data/sesion.js', () => ({
  leerSesion: vi.fn(),
}))

function PanelRestringido() {
  const { sesion } = useOutletContext()

  return (
    <section>
      <h1>Panel restringido de prueba</h1>
      <p>Rol recibido: {sesion.rol}</p>
      <p>Usuario recibido: {sesion.usuario}</p>
    </section>
  )
}

function montarRuta(
  permitidos = ['Administrador'],
) {
  render(
    <MemoryRouter initialEntries={['/panel-prueba']}>
      <Routes>
        <Route
          path="/"
          element={<h1>Portada de prueba</h1>}
        />

        <Route
          path="/app/inicio"
          element={<h1>Inicio de prueba</h1>}
        />

        <Route
          element={
            <RutaPorRol permitidos={permitidos} />
          }
        >
          <Route
            path="/panel-prueba"
            element={<PanelRestringido />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RutaPorRol', () => {
  beforeEach(() => {
    leerSesion.mockReset()
    leerSesion.mockReturnValue(null)
  })

  it('redirige a la portada cuando no existe sesión', async () => {
    montarRuta()

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Panel restringido de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('redirige al inicio cuando el rol no está permitido', async () => {
    leerSesion.mockReturnValue({
      usuario: 'Ana Pérez',
      correo: 'ana@gmail.com',
      rol: 'Cliente',
    })

    montarRuta(['Administrador', 'Locutor'])

    expect(
      await screen.findByRole('heading', {
        name: 'Inicio de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Panel restringido de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('permite el acceso y entrega la sesión cuando el rol está autorizado', () => {
    leerSesion.mockReturnValue({
      usuario: 'Administradora de prueba',
      correo: 'admin@jugoseo.com',
      rol: 'Administrador',
    })

    montarRuta(['Administrador', 'Locutor'])

    expect(
      screen.getByRole('heading', {
        name: 'Panel restringido de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Rol recibido: Administrador',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Usuario recibido: Administradora de prueba',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Inicio de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })
})