import {
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  describe,
  expect,
  it,
} from 'vitest'

import Contacto from '../components/Contacto.jsx'

import {
  MAX_CARACTERES_CORREO,
  MAX_CARACTERES_MENSAJE,
  MAX_CARACTERES_NOMBRE,
} from '../utils/validacionesContacto.js'

function obtenerCampos() {
  return {
    nombre: screen.getByRole('textbox', {
      name: 'Nombre',
      exact: true,
    }),
    correo: screen.getByRole('textbox', {
      name: 'Correo',
      exact: true,
    }),
    mensaje: screen.getByRole('textbox', {
      name: 'Mensaje',
      exact: true,
    }),
  }
}

async function completarFormulario(
  usuario,
  correoIngresado = 'ana@gmail.com',
) {
  const campos = obtenerCampos()

  await usuario.type(campos.nombre, 'Ana Pérez')

  await usuario.type(
    campos.correo,
    correoIngresado,
  )

  await usuario.type(
    campos.mensaje,
    'Me gustaría proponer un nuevo programa.',
  )

  return campos
}

describe('Contacto', () => {
  it('muestra el formulario con sus campos vacíos', () => {
    render(<Contacto />)

    expect(
      screen.getByRole('heading', {
        name: 'Contacto',
        exact: true,
      }),
    ).toBeInTheDocument()

    const campos = obtenerCampos()

    expect(campos.nombre).toHaveValue('')
    expect(campos.correo).toHaveValue('')
    expect(campos.mensaje).toHaveValue('')

    expect(
      screen.getByRole('button', {
        name: 'Enviar mensaje',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('rechaza el envío cuando los campos están vacíos', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Enviar mensaje',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Revisa los campos marcados en rojo antes de enviar.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')

    const campos = obtenerCampos()

    Object.values(campos).forEach((campo) => {
      expect(campo).toHaveAttribute(
        'aria-invalid',
        'true',
      )

      expect(campo).toHaveClass('is-invalid')
    })

    expect(
      screen.getByText('Ingrese su nombre'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Ingrese un mensaje'),
    ).toBeInTheDocument()
  })

  it('valida el nombre al salir del campo y permite corregirlo', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    const { nombre } = obtenerCampos()

    expect(nombre).not.toHaveClass('is-invalid')
    expect(nombre).not.toHaveClass('is-valid')

    await usuario.click(nombre)
    await usuario.tab()

    expect(nombre).toHaveClass('is-invalid')

    expect(nombre).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    await usuario.type(nombre, 'Ana Pérez')
    await usuario.tab()

    expect(nombre).toHaveClass('is-valid')

    expect(nombre).toHaveAttribute(
      'aria-invalid',
      'false',
    )
  })

  it('rechaza un correo cuyo dominio no está permitido', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    const campos = await completarFormulario(
      usuario,
      'ana@example.com',
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Enviar mensaje',
        exact: true,
      }),
    )

    expect(campos.correo).toHaveClass('is-invalid')

    expect(campos.correo).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    expect(campos.nombre).toHaveClass('is-valid')
    expect(campos.mensaje).toHaveClass('is-valid')

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')

    expect(campos.correo).toHaveValue(
      'ana@example.com',
    )
  })

  it('actualiza el contador al escribir el mensaje', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    expect(
      screen.getByText(
        `0 / ${MAX_CARACTERES_MENSAJE} caracteres`,
      ),
    ).toBeInTheDocument()

    await usuario.type(
      obtenerCampos().mensaje,
      'Hola',
    )

    expect(
      screen.getByText(
        `4 / ${MAX_CARACTERES_MENSAJE} caracteres`,
      ),
    ).toBeInTheDocument()
  })

  it('declara los límites de longitud de los campos', () => {
    render(<Contacto />)

    const campos = obtenerCampos()

    expect(campos.nombre).toHaveAttribute(
      'maxlength',
      String(MAX_CARACTERES_NOMBRE),
    )

    expect(campos.correo).toHaveAttribute(
      'maxlength',
      String(MAX_CARACTERES_CORREO),
    )

    expect(campos.mensaje).toHaveAttribute(
      'maxlength',
      String(MAX_CARACTERES_MENSAJE),
    )
  })

  it('valida datos correctos, informa el envío simulado y limpia el formulario', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    const campos = await completarFormulario(usuario)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Enviar mensaje',
        exact: true,
      }),
    )

    const aviso = screen.getByRole('status')

    expect(aviso).toHaveClass('alert-success')

    expect(aviso).toHaveTextContent(
      '¡Gracias, Ana Pérez!',
    )

    expect(aviso).toHaveTextContent(
      'Esta versión simula el envío; no se envió un correo real.',
    )

    Object.values(campos).forEach((campo) => {
      expect(campo).toHaveValue('')
      expect(campo).not.toHaveClass('is-invalid')
      expect(campo).not.toHaveClass('is-valid')
    })

    expect(
      screen.getByText(
        `0 / ${MAX_CARACTERES_MENSAJE} caracteres`,
      ),
    ).toBeInTheDocument()
  })

  it('retira el aviso de éxito al comenzar un nuevo mensaje', async () => {
    const usuario = userEvent.setup()

    render(<Contacto />)

    await completarFormulario(usuario)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Enviar mensaje',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-success')

    await usuario.type(
      obtenerCampos().nombre,
      'Pedro',
    )

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()

    expect(
      obtenerCampos().nombre,
    ).toHaveValue('Pedro')
  })
})