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
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import PanelUsuarios from '../components/PanelUsuarios.jsx'

import {
  actualizarUsuario,
  crearUsuarioInterno,
  eliminarUsuario,
  obtenerUsuariosAdministrables,
} from '../utils/usuariosStorage.js'

const {
  datosCreacion,
  datosEdicion,
} = vi.hoisted(() => ({
  datosCreacion: {
    nombre: 'Pedro',
    apellido: 'Soto',
    correo: 'pedro@jugoseo.com',
    rol: 'Locutor',
    password: 'clave123',
    passwordConfirm: 'clave123',
  },
  datosEdicion: {
    nombre: 'Ana María',
    apellido: 'Pérez',
    rol: 'Cliente',
    tipo: 'Socio VIP',
    password: '',
    passwordConfirm: '',
  },
}))

vi.mock('../utils/usuariosStorage.js', () => ({
  actualizarUsuario: vi.fn(),
  crearUsuarioInterno: vi.fn(),
  eliminarUsuario: vi.fn(),
  obtenerUsuariosAdministrables: vi.fn(),
}))

vi.mock(
  '../components/UsuarioInternoModal.jsx',
  async () => {
    const { useState } = await import('react')

    return {
      default: function CreacionSimulada({
        usuarios,
        cerrar,
        guardar,
      }) {
        const [fallo, setFallo] = useState(false)

        return (
          <div
            role="dialog"
            aria-label="Creación interna de prueba"
          >
            <p>
              Usuarios recibidos: {usuarios.length}
            </p>

            {fallo && (
              <p role="alert">
                Creación rechazada en el modal de prueba.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                const resultado = guardar(datosCreacion)
                setFallo(!resultado)
              }}
            >
              Guardar creación de prueba
            </button>

            <button type="button" onClick={cerrar}>
              Cerrar creación de prueba
            </button>
          </div>
        )
      },
    }
  },
)

vi.mock(
  '../components/EditarUsuarioModal.jsx',
  async () => {
    const { useState } = await import('react')

    return {
      default: function EdicionSimulada({
        usuario,
        cerrar,
        guardar,
      }) {
        const [error, setError] = useState('')

        return (
          <div
            role="dialog"
            aria-label="Edición de usuario de prueba"
          >
            <p>
              Cuenta recibida: {usuario.correo}
            </p>

            {error && (
              <p role="alert">{error}</p>
            )}

            <button
              type="button"
              onClick={() => {
                const resultado = guardar(datosEdicion)

                setError(
                  resultado.ok
                    ? ''
                    : resultado.mensaje,
                )
              }}
            >
              Guardar edición de prueba
            </button>

            <button type="button" onClick={cerrar}>
              Cerrar edición de prueba
            </button>
          </div>
        )
      },
    }
  },
)

const usuariosPrueba = [
  {
    nombre: 'Administradora',
    apellido: 'Actual',
    correo: 'ADMIN@JUGOSEO.COM',
    rol: 'Administrador',
    tipo: null,
    origen: 'Interno',
    fechaCreacion: '2026-10-01T12:00:00.000Z',
  },
  {
    nombre: 'Cuenta',
    apellido: 'Demo',
    correo: 'demo@gmail.com',
    rol: 'Cliente',
    tipo: 'Radioescucha Oficial',
    origen: 'Demostración',
    fechaCreacion: null,
  },
  {
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@gmail.com',
    rol: 'Cliente',
    tipo: 'Socio VIP',
    origen: 'Registro',
    fechaCreacion: 'fecha-invalida',
    requiereRevision: true,
  },
]

function MarcoConSesion() {
  return (
    <Outlet
      context={{
        sesion: {
          usuario: 'Administradora Actual',
          correo: 'admin@jugoseo.com',
          rol: 'Administrador',
        },
      }}
    />
  )
}

function montarPanel() {
  render(
    <MemoryRouter initialEntries={['/panel-prueba']}>
      <Routes>
        <Route element={<MarcoConSesion />}>
          <Route
            path="/panel-prueba"
            element={<PanelUsuarios />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function boton(nombre) {
  return screen.getByRole('button', {
    name: nombre,
    exact: true,
  })
}

function filaUsuario(correo) {
  return within(
    screen.getByText(correo, {
      exact: true,
    }).closest('tr'),
  )
}

async function abrirEdicion(usuario) {
  await usuario.click(
    filaUsuario('ana@gmail.com')
      .getByRole('button', {
        name: 'Editar',
        exact: true,
      }),
  )
}

async function solicitarEliminacion(usuario) {
  await usuario.click(
    filaUsuario('ana@gmail.com')
      .getByRole('button', {
        name: 'Eliminar',
        exact: true,
      }),
  )
}

describe('PanelUsuarios', () => {
  beforeEach(() => {
    obtenerUsuariosAdministrables.mockReset()
    obtenerUsuariosAdministrables.mockReturnValue(
      usuariosPrueba,
    )

    crearUsuarioInterno.mockReset()
    actualizarUsuario.mockReset()
    eliminarUsuario.mockReset()

    vi.spyOn(window, 'confirm')
      .mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra las cuentas, sus fechas y las protecciones de cuenta propia y demostración', () => {
    montarPanel()

    expect(
      screen.getByRole('heading', {
        name: 'Gestión de usuarios',
        exact: true,
      }),
    ).toBeInTheDocument()

    const tabla = within(
      screen.getByRole('table'),
    )

    expect(
      tabla.getAllByRole('row'),
    ).toHaveLength(4)

    const propia = filaUsuario(
      'ADMIN@JUGOSEO.COM',
    )

    expect(
      propia.getByText('Tu cuenta'),
    ).toBeInTheDocument()

    expect(
      propia.queryByRole('button'),
    ).not.toBeInTheDocument()

    expect(
      propia.getByText(
        new Date(
          usuariosPrueba[0].fechaCreacion,
        ).toLocaleDateString('es-CL'),
      ),
    ).toBeInTheDocument()

    const demo = filaUsuario('demo@gmail.com')

    expect(
      demo.getByText(
        'Cuenta de demostración',
      ),
    ).toBeInTheDocument()

    expect(
      demo.queryByRole('button'),
    ).not.toBeInTheDocument()

    expect(
      demo.getByText('—', { exact: true }),
    ).toBeInTheDocument()

    const editable = filaUsuario('ana@gmail.com')

    expect(
      editable.getByText(
        'Revisar dominio o rol',
      ),
    ).toBeInTheDocument()

    expect(
      editable.getByText('—', { exact: true }),
    ).toBeInTheDocument()

    expect(
      editable.getByRole('button', {
        name: 'Editar',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('mantiene la tabla sin filas de datos cuando no existen cuentas', () => {
    obtenerUsuariosAdministrables.mockReturnValue([])

    montarPanel()

    expect(
      within(
        screen.getByRole('table'),
      ).getAllByRole('row'),
    ).toHaveLength(1)

    expect(
      boton('Crear cuenta interna'),
    ).toBeEnabled()
  })

  it('muestra el error de carga y deshabilita la creación', () => {
    obtenerUsuariosAdministrables.mockImplementation(
      () => {
        throw new Error('Error simulado de lectura')
      },
    )

    montarPanel()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar esta sección. Inténtalo nuevamente.',
    )

    expect(
      boton('Crear cuenta interna'),
    ).toBeDisabled()

    expect(
      screen.queryByRole('table'),
    ).not.toBeInTheDocument()
  })

  it('abre la creación con el listado de usuarios y permite cerrarla sin guardar', async () => {
    const usuario = userEvent.setup()

    montarPanel()

    await usuario.click(
      boton('Crear cuenta interna'),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Creación interna de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Usuarios recibidos: 3',
      ),
    ).toBeInTheDocument()

    await usuario.click(
      boton('Cerrar creación de prueba'),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      crearUsuarioInterno,
    ).not.toHaveBeenCalled()
  })

  it('crea una cuenta interna, actualiza la tabla y cierra el formulario', async () => {
    const usuario = userEvent.setup()

    crearUsuarioInterno.mockReturnValue([
      ...usuariosPrueba,
      {
        ...datosCreacion,
        origen: 'Interno',
        fechaCreacion: null,
      },
    ])

    montarPanel()

    await usuario.click(
      boton('Crear cuenta interna'),
    )

    await usuario.click(
      boton('Guardar creación de prueba'),
    )

    expect(
      crearUsuarioInterno,
    ).toHaveBeenCalledWith(datosCreacion)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Cuenta creada.')

    expect(
      screen.getByText(
        'pedro@jugoseo.com',
        { exact: true },
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('devuelve un rechazo al modal y lo conserva si falla la creación', async () => {
    const usuario = userEvent.setup()

    crearUsuarioInterno.mockImplementation(() => {
      throw new Error('Creación rechazada')
    })

    montarPanel()

    await usuario.click(
      boton('Crear cuenta interna'),
    )

    await usuario.click(
      boton('Guardar creación de prueba'),
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Creación rechazada en el modal de prueba.',
    )

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('permite cerrar la edición y después guardar cambios en la cuenta seleccionada', async () => {
    const usuario = userEvent.setup()

    actualizarUsuario.mockReturnValue([
      usuariosPrueba[0],
      usuariosPrueba[1],
      {
        ...usuariosPrueba[2],
        ...datosEdicion,
      },
    ])

    montarPanel()

    await abrirEdicion(usuario)

    expect(
      screen.getByText(
        'Cuenta recibida: ana@gmail.com',
      ),
    ).toBeInTheDocument()

    await usuario.click(
      boton('Cerrar edición de prueba'),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      actualizarUsuario,
    ).not.toHaveBeenCalled()

    await abrirEdicion(usuario)

    await usuario.click(
      boton('Guardar edición de prueba'),
    )

    expect(
      actualizarUsuario,
    ).toHaveBeenCalledWith(
      'ana@gmail.com',
      datosEdicion,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Cuenta actualizada.',
    )

    expect(
      screen.getByText(
        'Ana María Pérez',
        { exact: true },
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('entrega al modal el mensaje de error de una edición rechazada', async () => {
    const usuario = userEvent.setup()

    actualizarUsuario.mockImplementation(() => {
      throw { codigo: 'DATOS_INVALIDOS' }
    })

    montarPanel()

    await abrirEdicion(usuario)

    await usuario.click(
      boton('Guardar edición de prueba'),
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Revisa los datos ingresados.',
    )

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('elimina la cuenta confirmada y actualiza el listado', async () => {
    const usuario = userEvent.setup()

    eliminarUsuario.mockReturnValue(
      usuariosPrueba.slice(0, 2),
    )

    montarPanel()

    await solicitarEliminacion(usuario)

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Eliminar la cuenta "ana@gmail.com"? ' +
      'Esta acción no se puede deshacer desde la aplicación.',
    )

    expect(
      eliminarUsuario,
    ).toHaveBeenCalledWith('ana@gmail.com')

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Cuenta eliminada.',
    )

    expect(
      screen.queryByText(
        'ana@gmail.com',
        { exact: true },
      ),
    ).not.toBeInTheDocument()
  })

  it('no elimina si se rechaza la confirmación', async () => {
    const usuario = userEvent.setup()

    window.confirm.mockReturnValue(false)

    montarPanel()

    await solicitarEliminacion(usuario)

    expect(
      eliminarUsuario,
    ).not.toHaveBeenCalled()

    expect(
      screen.getByText(
        'ana@gmail.com',
        { exact: true },
      ),
    ).toBeInTheDocument()
  })

  it.each([
    {
      codigo: 'USUARIO_ASIGNADO',
      mensaje:
        'Reasigna o quita primero los programas vinculados a esta cuenta.',
    },
    {
      codigo: 'EMISION_ACTIVA',
      mensaje:
        'Finaliza primero la emisión iniciada por esta cuenta.',
    },
    {
      codigo: 'ERROR_DESCONOCIDO',
      mensaje:
        'No se pudo completar la operación. Inténtalo nuevamente.',
    },
  ])(
    'muestra el error de eliminación correspondiente a $codigo',
    async ({ codigo, mensaje }) => {
      const usuario = userEvent.setup()

      eliminarUsuario.mockImplementation(() => {
        throw { codigo }
      })

      montarPanel()

      await solicitarEliminacion(usuario)

      expect(
        screen.getByRole('status'),
      ).toHaveTextContent(mensaje)

      expect(
        screen.getByRole('status'),
      ).toHaveClass('alert-danger')

      expect(
        screen.getByText(
          'ana@gmail.com',
          { exact: true },
        ),
      ).toBeInTheDocument()
    },
  )
})