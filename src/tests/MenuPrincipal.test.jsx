import {
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  MemoryRouter,
  useLocation,
} from 'react-router-dom'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import MenuPrincipal from '../components/MenuPrincipal.jsx'

function RutaActual() {
  const ubicacion = useLocation()

  return (
    <div data-testid="ruta-actual">
      {ubicacion.pathname}
    </div>
  )
}

function montarMenu({
  rol = 'Cliente',
  rutaInicial = '/app/inicio',
} = {}) {
  const cerrarSesion = vi.fn()

  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <MenuPrincipal
        sesion={{
          usuario: 'Ana Pérez',
          correo: 'ana@gmail.com',
          rol,
        }}
        cerrarSesion={cerrarSesion}
      />

      <RutaActual />
    </MemoryRouter>,
  )

  return { cerrarSesion }
}

function obtenerBotonMenu() {
  return screen.getByRole('button', {
    name: 'Abrir menú',
    exact: true,
  })
}

async function abrirMenu(usuario) {
  await usuario.click(obtenerBotonMenu())

  expect(
    obtenerBotonMenu(),
  ).toHaveAttribute('aria-expanded', 'true')
}

describe('MenuPrincipal', () => {
  it('muestra el usuario y los enlaces generales sin paneles internos para Cliente', async () => {
    const usuario = userEvent.setup()

    montarMenu()

    await abrirMenu(usuario)

    expect(
      screen.getByText('Hola, Ana Pérez'),
    ).toBeInTheDocument()

    const enlaces = [
      ['Inicio', '/app/inicio'],
      ['Tienda', '/app/tienda'],
      ['Mis Pedidos', '/app/pedidos'],
      ['Noticias', '/app/noticias'],
      ['Programas', '/app/programas'],
      ['Contacto', '/app/contacto'],
    ]

    for (const [nombre, destino] of enlaces) {
      expect(
        screen.getByRole('link', {
          name: nombre,
          exact: true,
        }),
      ).toHaveAttribute('href', destino)
    }

    expect(
      screen.queryByRole('link', {
        name: 'Panel Locutor',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('link', {
        name: 'Panel Admin',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      rol: 'Locutor',
      muestraAdmin: false,
    },
    {
      rol: 'Administrador',
      muestraAdmin: true,
    },
  ])(
    'muestra los paneles correspondientes al rol $rol',
    async ({ rol, muestraAdmin }) => {
      const usuario = userEvent.setup()

      montarMenu({ rol })

      await abrirMenu(usuario)

      expect(
        screen.getByRole('link', {
          name: 'Panel Locutor',
          exact: true,
        }),
      ).toHaveAttribute('href', '/app/locutor')

      const enlaceAdmin = screen.queryByRole('link', {
        name: 'Panel Admin',
        exact: true,
      })

      if (muestraAdmin) {
        expect(enlaceAdmin).toHaveAttribute(
          'href',
          '/app/admin',
        )
      } else {
        expect(
          enlaceAdmin,
        ).not.toBeInTheDocument()
      }
    },
  )

  it('navega a Tienda y cierra el menú al seleccionar el enlace', async () => {
    const usuario = userEvent.setup()

    montarMenu()

    await abrirMenu(usuario)

    await usuario.click(
      screen.getByRole('link', {
        name: 'Tienda',
        exact: true,
      }),
    )

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/app\/tienda$/)

    expect(
      obtenerBotonMenu(),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('vuelve al inicio y cierra el menú al pulsar la marca', async () => {
    const usuario = userEvent.setup()

    montarMenu({
      rutaInicial: '/app/contacto',
    })

    await abrirMenu(usuario)

    await usuario.click(
      screen.getByRole('link', {
        name: /JUGOSEO/,
      }),
    )

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/app\/inicio$/)

    expect(
      obtenerBotonMenu(),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('solicita el cierre de sesión al pulsar el botón', async () => {
    const usuario = userEvent.setup()

    const { cerrarSesion } = montarMenu()

    await abrirMenu(usuario)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar sesión',
        exact: true,
      }),
    )

    expect(cerrarSesion).toHaveBeenCalledTimes(1)
  })

  it('permite abrir y cerrar el menú con el botón de despliegue', async () => {
    const usuario = userEvent.setup()

    montarMenu()

    expect(
      obtenerBotonMenu(),
    ).toHaveAttribute('aria-expanded', 'false')

    await abrirMenu(usuario)

    await usuario.click(obtenerBotonMenu())

    expect(
      obtenerBotonMenu(),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})