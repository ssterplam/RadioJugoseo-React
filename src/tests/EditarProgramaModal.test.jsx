import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import EditarProgramaModal from '../components/EditarProgramaModal.jsx'

const programaPrueba = {
  id: 'programa-prueba',
  nombre: 'Programa de prueba',
  conductor: 'Ana Pérez',
  imagen: 'programa-prueba.jpg',
  horarioDetalle: 'Lunes a viernes, 10:00 a 12:00',
  descripcion: 'Descripción del programa de prueba.',
  parrafos: [
    'Primer párrafo del programa.',
    'Segundo párrafo del programa.',
  ],
  caracteristicas: [
    'Selección musical',
    'Participación de oyentes',
  ],
}

function montarModal(propiedades = {}) {
  const props = {
    programa: programaPrueba,
    esAdministrador: true,
    cerrar: vi.fn(),
    guardar: vi.fn(() => true),
    ...propiedades,
  }

  render(
    <EditarProgramaModal {...props} />,
  )

  return props
}

function obtenerCampo(nombre) {
  return screen.getByRole('textbox', {
    name: nombre,
    exact: true,
  })
}

async function guardarCambios(usuario) {
  await usuario.click(
    screen.getByRole('button', {
      name: 'Guardar cambios',
      exact: true,
    }),
  )
}

describe('EditarProgramaModal', () => {
  it('carga los datos existentes y convierte los arreglos en texto por líneas', () => {
    montarModal()

    expect(
      screen.getByRole('dialog', {
        name: 'Editar programa',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      obtenerCampo('Nombre del programa'),
    ).toHaveValue(programaPrueba.nombre)

    expect(
      obtenerCampo('Conductor o nombre artístico'),
    ).toHaveValue(programaPrueba.conductor)

    expect(
      obtenerCampo('Archivo de imagen'),
    ).toHaveValue(programaPrueba.imagen)

    expect(
      obtenerCampo('Horario'),
    ).toHaveValue(programaPrueba.horarioDetalle)

    expect(
      obtenerCampo('Descripción del catálogo'),
    ).toHaveValue(programaPrueba.descripcion)

    expect(
      obtenerCampo('Contenido de la ficha'),
    ).toHaveValue(
      programaPrueba.parrafos.join('\n'),
    )

    expect(
      obtenerCampo('Lo que puedes esperar'),
    ).toHaveValue(
      programaPrueba.caracteristicas.join('\n'),
    )

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('permite al administrador editar todos los campos', () => {
    montarModal({
      esAdministrador: true,
    })

    for (
      const campo of screen.getAllByRole('textbox')
    ) {
      expect(campo).not.toHaveAttribute(
        'readonly',
      )
    }

    fireEvent.change(
      obtenerCampo('Nombre del programa'),
      {
        target: {
          value: 'Nombre actualizado',
        },
      },
    )

    expect(
      obtenerCampo('Nombre del programa'),
    ).toHaveValue('Nombre actualizado')
  })

  it('mantiene nombre, conductor y horario en solo lectura para un usuario no administrador', () => {
    montarModal({
      esAdministrador: false,
    })

    for (const nombre of [
      'Nombre del programa',
      'Conductor o nombre artístico',
      'Horario',
    ]) {
      expect(
        obtenerCampo(nombre),
      ).toHaveAttribute('readonly')
    }

    for (const nombre of [
      'Archivo de imagen',
      'Descripción del catálogo',
      'Contenido de la ficha',
      'Lo que puedes esperar',
    ]) {
      expect(
        obtenerCampo(nombre),
      ).not.toHaveAttribute('readonly')
    }
  })

  it('muestra el modo de creación y envía los datos al crear', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      esNuevo: true,
    })

    expect(
      screen.getByRole('dialog', {
        name: 'Crear programa',
        exact: true,
      }),
    ).toBeInTheDocument()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Crear programa',
        exact: true,
      }),
    )

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: programaPrueba.nombre,
        imagen: programaPrueba.imagen,
      }),
    )
  })

  it('rechaza campos obligatorios vacíos sin llamar a guardar', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal()

    const camposObligatorios = [
      'Nombre del programa',
      'Conductor o nombre artístico',
      'Archivo de imagen',
      'Horario',
      'Descripción del catálogo',
      'Contenido de la ficha',
      'Lo que puedes esperar',
    ]

    for (const nombre of camposObligatorios) {
      fireEvent.change(
        obtenerCampo(nombre),
        {
          target: { value: '' },
        },
      )
    }

    await guardarCambios(usuario)

    expect(guardar).not.toHaveBeenCalled()

    for (const nombre of camposObligatorios) {
      const campo = obtenerCampo(nombre)

      expect(campo).toHaveClass('is-invalid')

      expect(campo).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    }

    expect(
      screen.getByText(
        'El nombre es obligatorio.',
      ),
    ).toBeInTheDocument()
  })

  it('envía los datos editados y limpia el error del campo al corregirlo', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal()

    const descripcion = obtenerCampo(
      'Descripción del catálogo',
    )

    fireEvent.change(descripcion, {
      target: { value: '' },
    })

    await guardarCambios(usuario)

    expect(descripcion).toHaveClass(
      'is-invalid',
    )

    expect(guardar).not.toHaveBeenCalled()

    fireEvent.change(descripcion, {
      target: {
        value: 'Descripción actualizada.',
      },
    })

    expect(descripcion).not.toHaveClass(
      'is-invalid',
    )

    expect(descripcion).toHaveAttribute(
      'aria-invalid',
      'false',
    )

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith({
      nombre: programaPrueba.nombre,
      conductor: programaPrueba.conductor,
      imagen: programaPrueba.imagen,
      horarioDetalle:
        programaPrueba.horarioDetalle,
      descripcion: 'Descripción actualizada.',
      parrafos:
        programaPrueba.parrafos.join('\n'),
      caracteristicas:
        programaPrueba.caracteristicas.join('\n'),
    })
  })

  it('muestra el error si guardar devuelve false y lo retira al editar', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      guardar: vi.fn(() => false),
    })

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo guardar el cambio. Inténtalo nuevamente.',
    )

    fireEvent.change(
      obtenerCampo('Descripción del catálogo'),
      {
        target: {
          value: 'Otro intento de descripción.',
        },
      },
    )

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('solicita el cierre mediante Cancelar y Cerrar sin guardar', async () => {
    const usuario = userEvent.setup()

    const {
      cerrar,
      guardar,
    } = montarModal()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cancelar',
        exact: true,
      }),
    )

    expect(cerrar).toHaveBeenCalledTimes(1)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar',
        exact: true,
      }),
    )

    expect(cerrar).toHaveBeenCalledTimes(2)

    expect(guardar).not.toHaveBeenCalled()
  })
})