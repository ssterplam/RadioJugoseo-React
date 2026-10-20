import {
  render,
  screen,
} from '@testing-library/react'

import {
  MemoryRouter,
  useLocation,
} from 'react-router-dom'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import App from '../App.jsx'

import { leerSesion } from '../data/sesion.js'

vi.mock('../data/sesion.js', async (importOriginal) => {
  const original = await importOriginal()

  return {
    ...original,
    leerSesion: vi.fn(),
  }
})

vi.mock('../components/Portada.jsx', () => ({
  default: function PortadaSimulada() {
    return <h1>Portada de prueba</h1>
  },
}))

vi.mock('../components/Registro.jsx', () => ({
  default: function RegistroSimulado() {
    return <h1>Registro de prueba</h1>
  },
}))

vi.mock('../components/Inicio.jsx', () => ({
  default: function InicioSimulado() {
    return <h1>Inicio de prueba</h1>
  },
}))

vi.mock('../components/ReproductorRadio.jsx', () => ({
  default: function ReproductorSimulado() {
    return (
      <div data-testid="reproductor-prueba">
        Reproductor de prueba
      </div>
    )
  },
}))

vi.mock(
  '../components/AplicacionInterna.jsx',
  async () => {
    const { Outlet } = await import('react-router-dom')

    return {
      default: function AplicacionInternaSimulada() {
        return (
          <div data-testid="estructura-interna">
            <Outlet />
          </div>
        )
      },
    }
  },
)

function RutaActual() {
  const ubicacion = useLocation()

  return (
    <div data-testid="ruta-actual">
      {ubicacion.pathname}
    </div>
  )
}

function montarApp(rutaInicial) {
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <App />
      <RutaActual />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    leerSesion.mockReset()

    leerSesion.mockReturnValue({
      usuario: 'Ana Pérez',
      correo: 'ana@gmail.com',
      rol: 'Cliente',
    })
  })

  it.each([
    {
      ruta: '/',
      titulo: 'Portada de prueba',
    },
    {
      ruta: '/registro',
      titulo: 'Registro de prueba',
    },
  ])(
    'muestra la pantalla pública correspondiente a $ruta y conserva el reproductor',
    async ({ ruta, titulo }) => {
      leerSesion.mockReturnValue(null)

      montarApp(ruta)

      expect(
        await screen.findByRole('heading', {
          name: titulo,
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        screen.getByTestId('ruta-actual').textContent,
      ).toBe(ruta)

      expect(
        screen.getByTestId('reproductor-prueba'),
      ).toBeInTheDocument()

      expect(
        screen.queryByTestId('estructura-interna'),
      ).not.toBeInTheDocument()
    },
  )

  it('redirige de /app a /app/inicio cuando existe una sesión válida', async () => {
    montarApp('/app')

    expect(
      await screen.findByRole('heading', {
        name: 'Inicio de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/app\/inicio$/)

    expect(
      screen.getByTestId('estructura-interna'),
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('reproductor-prueba'),
    ).toBeInTheDocument()
  })

  it('redirige a la portada al acceder a una ruta interna sin sesión', async () => {
    leerSesion.mockReturnValue(null)

    montarApp('/app/inicio')

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/$/)

    expect(
      screen.queryByRole('heading', {
        name: 'Inicio de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByTestId('estructura-interna'),
    ).not.toBeInTheDocument()
  })

  it('redirige una ruta desconocida a la portada', async () => {
    montarApp('/ruta-inexistente-de-prueba')

    expect(
      await screen.findByRole('heading', {
        name: 'Portada de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/$/)

    expect(
      screen.getByTestId('reproductor-prueba'),
    ).toBeInTheDocument()
  })
})