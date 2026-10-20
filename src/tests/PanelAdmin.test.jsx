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
  useOutletContext,
} from 'react-router-dom'

import {
  describe,
  expect,
  it,
} from 'vitest'

import PanelAdmin from '../components/PanelAdmin.jsx'

const sesionPrueba = {
  usuario: 'Administradora de prueba',
  correo: 'admin@jugoseo.com',
  rol: 'Administrador',
}

const secciones = [
  {
    nombre: 'Programas',
    ruta: 'programas',
  },
  {
    nombre: 'Productos',
    ruta: 'productos',
  },
  {
    nombre: 'Usuarios',
    ruta: 'usuarios',
  },
  {
    nombre: 'Pedidos',
    ruta: 'pedidos',
  },
]

function MarcoConSesion() {
  return (
    <Outlet
      context={{
        sesion: sesionPrueba,
      }}
    />
  )
}

function SeccionDePrueba({ nombre }) {
  const { sesion } = useOutletContext()

  return (
    <section>
      <h2>Sección de prueba: {nombre}</h2>

      <p>Usuario recibido: {sesion.usuario}</p>
      <p>Rol recibido: {sesion.rol}</p>
    </section>
  )
}

function montarPanel(
  rutaInicial = '/app/admin/programas',
) {
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route element={<MarcoConSesion />}>
          <Route
            path="/app/admin"
            element={<PanelAdmin />}
          >
            {secciones.map((seccion) => (
              <Route
                key={seccion.ruta}
                path={seccion.ruta}
                element={
                  <SeccionDePrueba
                    nombre={seccion.nombre}
                  />
                }
              />
            ))}
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function obtenerNavegacion() {
  return within(
    screen.getByRole('navigation', {
      name: 'Secciones de administración',
      exact: true,
    }),
  )
}

describe('PanelAdmin', () => {
  it('muestra el encabezado y los enlaces de las cuatro secciones', () => {
    montarPanel()

    expect(
      screen.getByRole('heading', {
        name: 'Panel Administrador',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Gestión de la radio y sus servicios.',
      ),
    ).toBeInTheDocument()

    const navegacion = obtenerNavegacion()

    expect(
      navegacion.getAllByRole('link'),
    ).toHaveLength(4)

    for (const seccion of secciones) {
      expect(
        navegacion.getByRole('link', {
          name: seccion.nombre,
          exact: true,
        }),
      ).toHaveAttribute(
        'href',
        `/app/admin/${seccion.ruta}`,
      )
    }
  })

  it('muestra la sección hija y le entrega la sesión mediante contexto', () => {
    montarPanel()

    expect(
      screen.getByRole('heading', {
        name: 'Sección de prueba: Programas',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Usuario recibido: Administradora de prueba',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Rol recibido: Administrador',
      ),
    ).toBeInTheDocument()
  })

  it('destaca únicamente el enlace de la sección activa', () => {
    montarPanel()

    const navegacion = obtenerNavegacion()

    const programas = navegacion.getByRole('link', {
      name: 'Programas',
      exact: true,
    })

    expect(programas).toHaveAttribute(
      'aria-current',
      'page',
    )

    expect(programas).toHaveClass(
      'jugoseo-btn-login',
    )

    for (const nombre of [
      'Productos',
      'Usuarios',
      'Pedidos',
    ]) {
      const enlace = navegacion.getByRole('link', {
        name: nombre,
        exact: true,
      })

      expect(enlace).toHaveClass(
        'btn-outline-light',
      )

      expect(enlace).not.toHaveAttribute(
        'aria-current',
      )
    }
  })

  it('permite recorrer las secciones y actualiza el enlace activo', async () => {
    const usuario = userEvent.setup()

    montarPanel()

    const navegacion = obtenerNavegacion()

    const recorrido = [
      secciones[1],
      secciones[2],
      secciones[3],
      secciones[0],
    ]

    for (const seccion of recorrido) {
      await usuario.click(
        navegacion.getByRole('link', {
          name: seccion.nombre,
          exact: true,
        }),
      )

      expect(
        await screen.findByRole('heading', {
          name: `Sección de prueba: ${seccion.nombre}`,
          exact: true,
        }),
      ).toBeInTheDocument()

      for (const opcion of secciones) {
        const enlace = navegacion.getByRole('link', {
          name: opcion.nombre,
          exact: true,
        })

        if (opcion.ruta === seccion.ruta) {
          expect(enlace).toHaveAttribute(
            'aria-current',
            'page',
          )

          expect(enlace).toHaveClass(
            'jugoseo-btn-login',
          )
        } else {
          expect(enlace).not.toHaveAttribute(
            'aria-current',
          )

          expect(enlace).toHaveClass(
            'btn-outline-light',
          )
        }
      }
    }
  })
})