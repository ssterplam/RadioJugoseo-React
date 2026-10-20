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

import PanelProgramas from '../components/PanelProgramas.jsx'

import useEmision from '../hooks/useEmision.js'

import { leerSesion } from '../data/sesion.js'

import {
  actualizarContenidoPrograma,
  asignarLocutor,
  crearPrograma,
  eliminarPrograma,
  obtenerProgramas,
} from '../utils/programasStorage.js'

import {
  obtenerLocutores,
} from '../utils/locutoresStorage.js'

const { datosFormulario } = vi.hoisted(() => ({
  datosFormulario: {
    nombre: 'Programa actualizado',
    conductor: 'Ana',
    horarioDetalle: 'Lunes, 10:00',
    imagen: 'programa.jpg',
    descripcion: 'Descripción de prueba.',
    parrafos: 'Contenido del programa.',
    caracteristicas: 'Música y conversación',
  },
}))

vi.mock('../hooks/useEmision.js', () => ({
  default: vi.fn(),
}))

vi.mock('../data/sesion.js', () => ({
  leerSesion: vi.fn(),
}))

vi.mock('../utils/programasStorage.js', () => ({
  actualizarContenidoPrograma: vi.fn(),
  asignarLocutor: vi.fn(),
  crearPrograma: vi.fn(),
  eliminarPrograma: vi.fn(),
  obtenerProgramas: vi.fn(),
}))

vi.mock('../utils/locutoresStorage.js', () => ({
  obtenerLocutores: vi.fn(),
}))

vi.mock('../components/ControlesEmision.jsx', () => ({
  default: function ControlesSimulados({ programa }) {
    return (
      <div>
        Controles de prueba: {programa.nombre}
      </div>
    )
  },
}))

vi.mock('../components/EditarProgramaModal.jsx', () => ({
  default: function ModalSimulado({
    programa,
    esAdministrador,
    esNuevo,
    cerrar,
    guardar,
  }) {
    return (
      <div
        role="dialog"
        aria-label="Formulario de programa de prueba"
      >
        <p>
          Modo recibido: {esNuevo ? 'Crear' : 'Editar'}
        </p>

        <p>
          Permiso recibido: {String(esAdministrador)}
        </p>

        <p>Nombre recibido: {programa.nombre}</p>

        <button
          type="button"
          onClick={() => guardar(datosFormulario)}
        >
          Guardar de prueba
        </button>

        <button type="button" onClick={cerrar}>
          Cerrar formulario de prueba
        </button>
      </div>
    )
  },
}))

const administrador = {
  usuario: 'Administradora de prueba',
  correo: 'admin@jugoseo.com',
  rol: 'Administrador',
}

const programasPrueba = [
  {
    id: 'programa-uno',
    nombre: 'Mañana de prueba',
    horarioDetalle: 'Lunes, 10:00',
    locutorCorreo: 'ana@jugoseo.com',
  },
  {
    id: 'programa-dos',
    nombre: 'Tarde de prueba',
    horarioDetalle: 'Martes, 16:00',
    locutorCorreo: null,
  },
]

function montarPanel({
  sesion = administrador,
  permitirAltasBajas = true,
} = {}) {
  leerSesion.mockReturnValue(sesion)

  function MarcoConSesion() {
    return <Outlet context={{ sesion }} />
  }

  render(
    <MemoryRouter initialEntries={['/panel-prueba']}>
      <Routes>
        <Route element={<MarcoConSesion />}>
          <Route
            path="/panel-prueba"
            element={
              <PanelProgramas
                permitirAltasBajas={permitirAltasBajas}
              />
            }
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

function tarjeta(nombre) {
  return within(
    screen.getByRole('heading', {
      name: nombre,
      exact: true,
    }).closest('article'),
  )
}

async function abrirEdicion(usuario) {
  await usuario.click(
    tarjeta('Mañana de prueba').getByRole('button', {
      name: 'Editar programa',
      exact: true,
    }),
  )
}

describe('PanelProgramas', () => {
  beforeEach(() => {
    obtenerProgramas.mockReset()
    obtenerProgramas.mockReturnValue(programasPrueba)

    obtenerLocutores.mockReset()
    obtenerLocutores.mockReturnValue([
      {
        nombre: 'Ana',
        correo: 'ana@jugoseo.com',
      },
      {
        nombre: 'Pedro',
        correo: 'pedro@jugoseo.com',
      },
    ])

    leerSesion.mockReset()
    crearPrograma.mockReset()
    actualizarContenidoPrograma.mockReset()
    asignarLocutor.mockReset()
    eliminarPrograma.mockReset()

    useEmision.mockReset()
    useEmision.mockReturnValue({
      emision: null,
      programa: null,
      error: '',
    })

    vi.spyOn(window, 'confirm')
      .mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra todos los programas y las acciones administrativas', () => {
    montarPanel()

    expect(
      screen.getByRole('heading', {
        name: 'Gestión de programas',
        level: 2,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('article'),
    ).toHaveLength(2)

    expect(boton('Crear programa')).toBeEnabled()

    const primera = tarjeta('Mañana de prueba')

    expect(
      primera.getByLabelText('Locutor asignado'),
    ).toHaveValue('ana@jugoseo.com')

    expect(
      primera.getByRole('link', {
        name: 'Ver ficha',
        exact: true,
      }),
    ).toHaveAttribute(
      'href',
      '/app/programas/programa-uno',
    )

    expect(
      primera.getByRole('button', {
        name: 'Eliminar',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('muestra al locutor solo sus programas y no ofrece altas ni bajas', async () => {
    const usuario = userEvent.setup()

    montarPanel({
      sesion: {
        usuario: 'Ana',
        correo: 'ANA@JUGOSEO.COM',
        rol: 'Locutor',
      },
      permitirAltasBajas: false,
    })

    expect(
      screen.getByRole('heading', {
        name: 'Mis programas',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('article'),
    ).toHaveLength(1)

    expect(
      screen.queryByRole('heading', {
        name: 'Tarde de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Crear programa',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Eliminar',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(obtenerLocutores).not.toHaveBeenCalled()

    await abrirEdicion(usuario)

    expect(
      screen.getByText('Permiso recibido: false'),
    ).toBeInTheDocument()
  })

  it('muestra el mensaje cuando el catálogo está vacío', () => {
    obtenerProgramas.mockReturnValue([])

    montarPanel()

    expect(
      screen.getByText(
        'No hay programas disponibles.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()
  })

  it('muestra un error de carga y bloquea la creación', () => {
    obtenerProgramas.mockImplementation(() => {
      throw new Error('Error simulado de lectura')
    })

    montarPanel()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar esta sección. Inténtalo nuevamente.',
    )

    expect(boton('Crear programa')).toBeDisabled()
  })

  it('actualiza la asignación del locutor', async () => {
    const usuario = userEvent.setup()

    asignarLocutor.mockReturnValue([
      {
        ...programasPrueba[0],
        locutorCorreo: 'pedro@jugoseo.com',
      },
      programasPrueba[1],
    ])

    montarPanel()

    await usuario.selectOptions(
      tarjeta('Mañana de prueba')
        .getByLabelText('Locutor asignado'),
      'pedro@jugoseo.com',
    )

    expect(asignarLocutor).toHaveBeenCalledWith(
      'programa-uno',
      'pedro@jugoseo.com',
    )

    expect(
      screen.getByText('Asignación actualizada.'),
    ).toHaveClass('alert-success')

    expect(
      tarjeta('Mañana de prueba')
        .getByLabelText('Locutor asignado'),
    ).toHaveValue('pedro@jugoseo.com')
  })

  it('abre la creación, permite cerrar y crea un programa al guardar', async () => {
    const usuario = userEvent.setup()

    crearPrograma.mockReturnValue([
      {
        ...programasPrueba[0],
        nombre: 'Programa creado de prueba',
      },
    ])

    montarPanel()

    await usuario.click(boton('Crear programa'))

    expect(
      screen.getByText('Modo recibido: Crear'),
    ).toBeInTheDocument()

    await usuario.click(
      boton('Cerrar formulario de prueba'),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    await usuario.click(boton('Crear programa'))
    await usuario.click(boton('Guardar de prueba'))

    expect(crearPrograma).toHaveBeenCalledWith(
      datosFormulario,
    )

    expect(
      screen.getByText('Programa creado.'),
    ).toHaveClass('alert-success')

    expect(
      screen.getByRole('heading', {
        name: 'Programa creado de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('edita un programa y actualiza el catálogo', async () => {
    const usuario = userEvent.setup()

    actualizarContenidoPrograma.mockReturnValue([
      {
        ...programasPrueba[0],
        nombre: 'Programa editado de prueba',
      },
    ])

    montarPanel()

    await abrirEdicion(usuario)

    expect(
      screen.getByText('Modo recibido: Editar'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Nombre recibido: Mañana de prueba',
      ),
    ).toBeInTheDocument()

    await usuario.click(boton('Guardar de prueba'))

    expect(
      actualizarContenidoPrograma,
    ).toHaveBeenCalledWith(
      'programa-uno',
      datosFormulario,
    )

    expect(
      screen.getByText('Programa actualizado.'),
    ).toHaveClass('alert-success')

    expect(
      screen.getByRole('heading', {
        name: 'Programa editado de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('conserva el formulario y los datos visibles si falla el guardado', async () => {
    const usuario = userEvent.setup()

    actualizarContenidoPrograma.mockImplementation(
      () => {
        throw new Error('Guardado rechazado')
      },
    )

    montarPanel()

    await abrirEdicion(usuario)
    await usuario.click(boton('Guardar de prueba'))

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Mañana de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Programa actualizado.'),
    ).not.toBeInTheDocument()
  })

  it('elimina el programa después de confirmar', async () => {
    const usuario = userEvent.setup()

    eliminarPrograma.mockReturnValue([
      programasPrueba[1],
    ])

    montarPanel()

    await usuario.click(
      tarjeta('Mañana de prueba')
        .getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
    )

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Eliminar el programa "Mañana de prueba"? ' +
      'Esta acción no se puede deshacer desde la aplicación.',
    )

    expect(eliminarPrograma).toHaveBeenCalledWith(
      'programa-uno',
    )

    expect(
      screen.getByText('Programa eliminado.'),
    ).toHaveClass('alert-success')

    expect(
      screen.queryByRole('heading', {
        name: 'Mañana de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('no elimina si se rechaza la confirmación', async () => {
    const usuario = userEvent.setup()

    window.confirm.mockReturnValue(false)

    montarPanel()

    await usuario.click(
      tarjeta('Mañana de prueba')
        .getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
    )

    expect(eliminarPrograma).not.toHaveBeenCalled()
  })

  it('muestra el error si falla la eliminación', async () => {
    const usuario = userEvent.setup()

    eliminarPrograma.mockImplementation(() => {
      throw new Error('Eliminación rechazada')
    })

    montarPanel()

    await usuario.click(
      tarjeta('Mañana de prueba')
        .getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
    )

    expect(
      screen.getByText(
        'No se pudo eliminar el programa. Comprueba su estado e inténtalo nuevamente.',
      ),
    ).toHaveClass('alert-danger')
  })

  it('bloquea asignación y eliminación del programa con emisión activa', () => {
    useEmision.mockReturnValue({
      emision: {
        programaId: 'programa-uno',
      },
      programa: {
        nombre: 'Mañana de prueba',
      },
      error: '',
    })

    montarPanel()

    expect(
      screen.getByText(
        'Emisión simulada activa: Mañana de prueba.',
      ),
    ).toBeInTheDocument()

    const primera = tarjeta('Mañana de prueba')

    expect(
      primera.getByLabelText('Locutor asignado'),
    ).toBeDisabled()

    expect(
      primera.getByRole('button', {
        name: 'Eliminar',
        exact: true,
      }),
    ).toBeDisabled()

    expect(
      primera.getByText(
        'Finaliza la emisión antes de eliminar el programa.',
      ),
    ).toBeInTheDocument()
  })

  it('muestra el error de emisión y bloquea asignación y eliminación', () => {
    useEmision.mockReturnValue({
      emision: null,
      programa: null,
      error: 'Estado de emisión no disponible.',
    })

    montarPanel()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Estado de emisión no disponible.',
    )

    for (
      const articulo of screen.getAllByRole('article')
    ) {
      const contenido = within(articulo)

      expect(
        contenido.getByLabelText('Locutor asignado'),
      ).toBeDisabled()

      expect(
        contenido.getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
      ).toBeDisabled()
    }
  })
})