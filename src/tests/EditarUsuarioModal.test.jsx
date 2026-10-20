import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import EditarUsuarioModal from '../components/EditarUsuarioModal.jsx'

const usuarioPrueba = {
  id: 'usuario-prueba',
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: 'ana@gmail.com',
  rol: 'Cliente',
  tipo: 'Socio VIP',
}

function montarModal(propiedades = {}) {
  const props = {
    usuario: usuarioPrueba,
    cerrar: vi.fn(),
    guardar: vi.fn(() => ({ ok: true })),
    ...propiedades,
  }

  render(
    <EditarUsuarioModal {...props} />,
  )

  return props
}

function campo(nombre) {
  return screen.getByLabelText(nombre, {
    exact: true,
  })
}

function cambiar(nombre, valor) {
  fireEvent.change(campo(nombre), {
    target: { value: valor },
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

describe('EditarUsuarioModal', () => {
  it('carga los datos del cliente sin mostrar una contraseña existente', () => {
    montarModal()

    expect(
      screen.getByRole('dialog', {
        name: 'Editar usuario',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(campo('Nombre')).toHaveValue('Ana')
    expect(campo('Apellido')).toHaveValue('Pérez')

    expect(
      screen.getByText('ana@gmail.com', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(campo('Rol')).toHaveValue('Cliente')

    expect(
      within(campo('Rol')).getAllByRole('option'),
    ).toHaveLength(1)

    expect(
      campo('Tipo de oyente'),
    ).toHaveValue('Socio VIP')

    expect(
      campo('Nueva contraseña (opcional)'),
    ).toHaveValue('')

    expect(
      campo('Confirmar nueva contraseña'),
    ).toHaveValue('')

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('permite cambiar una cuenta interna de Locutor a Administrador', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      usuario: {
        ...usuarioPrueba,
        correo: 'ana@jugoseo.com',
        rol: 'Locutor',
        tipo: null,
      },
    })

    const opciones = within(
      campo('Rol'),
    ).getAllByRole('option')

    expect(
      opciones.map((opcion) => opcion.value),
    ).toEqual([
      'Locutor',
      'Administrador',
    ])

    expect(
      screen.queryByLabelText('Tipo de oyente', {
        exact: true,
      }),
    ).not.toBeInTheDocument()

    await usuario.selectOptions(
      campo('Rol'),
      'Administrador',
    )

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'Administrador',
      tipo: '',
      password: '',
      passwordConfirm: '',
    })
  })

  it('envía los datos editados con contraseñas vacías para conservar la actual', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    cambiar('Nombre', 'Ana María')

    await usuario.selectOptions(
      campo('Tipo de oyente'),
      'Radioescucha Oficial',
    )

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith({
      nombre: 'Ana María',
      apellido: 'Pérez',
      rol: 'Cliente',
      tipo: 'Radioescucha Oficial',
      password: '',
      passwordConfirm: '',
    })

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('rechaza nombres y apellidos vacíos y limpia el error del campo al corregirlo', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    cambiar('Nombre', '')
    cambiar('Apellido', '')

    await guardarCambios(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      screen.getByText(
        'El nombre es obligatorio.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'El apellido es obligatorio.',
      ),
    ).toBeInTheDocument()

    expect(
      campo('Nombre'),
    ).toHaveClass('is-invalid')

    expect(
      campo('Apellido'),
    ).toHaveClass('is-invalid')

    cambiar('Nombre', 'Ana')

    expect(
      campo('Nombre'),
    ).not.toHaveClass('is-invalid')

    expect(
      campo('Apellido'),
    ).toHaveClass('is-invalid')
  })

  it('rechaza contraseñas inválidas y permite guardar una nueva contraseña correcta', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    cambiar(
      'Nueva contraseña (opcional)',
      '123',
    )

    cambiar(
      'Confirmar nueva contraseña',
      'otra123',
    )

    await guardarCambios(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      screen.getByText(
        'La contraseña debe tener entre 4 y 10 caracteres.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Las contraseñas no coinciden.',
      ),
    ).toBeInTheDocument()

    cambiar(
      'Nueva contraseña (opcional)',
      'nueva123',
    )

    cambiar(
      'Confirmar nueva contraseña',
      'nueva123',
    )

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'nueva123',
        passwordConfirm: 'nueva123',
      }),
    )
  })

  it('rechaza un cliente sin tipo de oyente seleccionado', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      usuario: {
        ...usuarioPrueba,
        tipo: null,
      },
    })

    expect(
      campo('Tipo de oyente'),
    ).toHaveValue('')

    await guardarCambios(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      campo('Tipo de oyente'),
    ).toHaveClass('is-invalid')

    expect(
      screen.getByText(
        'Selecciona un tipo de oyente válido.',
      ),
    ).toBeInTheDocument()
  })

  it('muestra el mensaje de guardado rechazado y lo limpia al editar', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      guardar: vi.fn(() => ({
        ok: false,
        mensaje: 'No se pudo actualizar la cuenta de prueba.',
      })),
    })

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo actualizar la cuenta de prueba.',
    )

    cambiar('Apellido', 'Soto')

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