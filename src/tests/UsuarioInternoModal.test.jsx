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

import UsuarioInternoModal from '../components/UsuarioInternoModal.jsx'

function montarModal(propiedades = {}) {
  const props = {
    usuarios: [],
    cerrar: vi.fn(),
    guardar: vi.fn(() => true),
    ...propiedades,
  }

  render(
    <UsuarioInternoModal {...props} />,
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

function completarFormulario(cambios = {}) {
  const datos = {
    Nombre: 'Ana',
    Apellido: 'Pérez',
    'Correo corporativo': 'ana@jugoseo.com',
    Contraseña: 'clave123',
    'Confirmar contraseña': 'clave123',
    ...cambios,
  }

  for (const [nombre, valor] of Object.entries(datos)) {
    cambiar(nombre, valor)
  }
}

async function crearCuenta(usuario) {
  await usuario.click(
    screen.getByRole('button', {
      name: 'Crear cuenta',
      exact: true,
    }),
  )
}

describe('UsuarioInternoModal', () => {
  it('muestra los campos vacíos y el rol Locutor seleccionado inicialmente', () => {
    montarModal()

    expect(
      screen.getByRole('dialog', {
        name: 'Crear cuenta interna',
        exact: true,
      }),
    ).toBeInTheDocument()

    for (const nombre of [
      'Nombre',
      'Apellido',
      'Correo corporativo',
      'Contraseña',
      'Confirmar contraseña',
    ]) {
      expect(campo(nombre)).toHaveValue('')
    }

    expect(campo('Rol')).toHaveValue('Locutor')

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
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('rechaza los campos obligatorios vacíos sin solicitar el guardado', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    await crearCuenta(usuario)

    expect(guardar).not.toHaveBeenCalled()

    for (const nombre of [
      'Nombre',
      'Apellido',
      'Correo corporativo',
      'Contraseña',
      'Confirmar contraseña',
    ]) {
      expect(
        campo(nombre),
      ).toHaveClass('is-invalid')

      expect(
        campo(nombre),
      ).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    }

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
  })

  it('envía una cuenta Locutor con datos válidos', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    completarFormulario()

    await crearCuenta(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Pérez',
      correo: 'ana@jugoseo.com',
      rol: 'Locutor',
      password: 'clave123',
      passwordConfirm: 'clave123',
    })

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('permite seleccionar Administrador y envía el rol elegido', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    completarFormulario()

    await usuario.selectOptions(
      campo('Rol'),
      'Administrador',
    )

    await crearCuenta(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        correo: 'ana@jugoseo.com',
        rol: 'Administrador',
      }),
    )
  })

  it('rechaza un correo público para una cuenta interna', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    completarFormulario({
      'Correo corporativo': 'ana@gmail.com',
    })

    await crearCuenta(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      campo('Correo corporativo'),
    ).toHaveClass('is-invalid')

    expect(
      screen.getByText(
        'Las cuentas Locutor y Administrador deben utilizar un correo @jugoseo.com.',
      ),
    ).toBeInTheDocument()
  })

  it('rechaza un correo que ya pertenece a otra cuenta', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      usuarios: [
        {
          correo: 'ANA@JUGOSEO.COM',
        },
      ],
    })

    completarFormulario()

    await crearCuenta(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      screen.getByText(
        'Ya existe una cuenta con este correo.',
      ),
    ).toBeInTheDocument()

    expect(
      campo('Correo corporativo'),
    ).toHaveClass('is-invalid')
  })

  it('rechaza contraseñas inválidas y permite corregirlas antes de guardar', async () => {
    const usuario = userEvent.setup()
    const { guardar } = montarModal()

    completarFormulario({
      Contraseña: '123',
      'Confirmar contraseña': 'otra123',
    })

    await crearCuenta(usuario)

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

    cambiar('Contraseña', 'nueva123')

    cambiar(
      'Confirmar contraseña',
      'nueva123',
    )

    expect(
      campo('Contraseña'),
    ).not.toHaveClass('is-invalid')

    expect(
      campo('Confirmar contraseña'),
    ).not.toHaveClass('is-invalid')

    await crearCuenta(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'nueva123',
        passwordConfirm: 'nueva123',
      }),
    )
  })

  it('muestra el error si guardar devuelve false y retira el aviso al editar', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      guardar: vi.fn(() => false),
    })

    completarFormulario()

    await crearCuenta(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo crear la cuenta. Revisa los datos e inténtalo nuevamente.',
    )

    cambiar('Nombre', 'Ana María')

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