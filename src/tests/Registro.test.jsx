import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import { MemoryRouter } from 'react-router-dom'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import Registro from '../components/Registro.jsx'

import {
  regionesComunas,
} from '../data/regionesComunas.js'

vi.mock('../data/usuariosDemo.js', () => ({
  usuariosDemo: [
    {
      correo: 'demo@gmail.com',
    },
  ],
}))

const CLAVE_USUARIOS = 'jugoseoRadioescuchas'

const regiones = Object.keys(regionesComunas)

const regionPrueba = regiones[0]
const comunaPrueba = regionesComunas[regionPrueba][0]

function montarRegistro() {
  render(
    <MemoryRouter>
      <Registro />
    </MemoryRouter>,
  )
}

function obtenerCampos() {
  return {
    nombre: screen.getByLabelText('Nombre', {
      exact: true,
    }),
    apellido: screen.getByLabelText('Apellido', {
      exact: true,
    }),
    correo: screen.getByLabelText(
      'Correo electrónico',
      { exact: true },
    ),
    run: screen.getByLabelText(
      'RUN (sin puntos ni guion)',
      { exact: true },
    ),
    password: screen.getByLabelText('Contraseña', {
      exact: true,
    }),
    passwordConfirm: screen.getByLabelText(
      'Confirmar contraseña',
      { exact: true },
    ),
    region: screen.getByLabelText('Región', {
      exact: true,
    }),
    comuna: screen.getByLabelText('Comuna', {
      exact: true,
    }),
  }
}

function completarFormulario(cambios = {}) {
  const datos = {
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'registro.pruebas@gmail.com',
    run: '123456785',
    password: 'clave123',
    passwordConfirm: 'clave123',
    ...cambios,
  }

  const campos = obtenerCampos()

  for (const [nombre, valor] of Object.entries(datos)) {
    fireEvent.change(campos[nombre], {
      target: { value: valor },
    })
  }

  fireEvent.change(campos.region, {
    target: { value: regionPrueba },
  })

  fireEvent.change(campos.comuna, {
    target: { value: comunaPrueba },
  })

  fireEvent.click(
    screen.getByRole('radio', {
      name: 'Radioescucha Oficial',
      exact: true,
    }),
  )

  return campos
}

async function crearCuenta(usuario) {
  await usuario.click(
    screen.getByRole('button', {
      name: 'Crear cuenta',
      exact: true,
    }),
  )
}

describe('Registro', () => {
  beforeEach(() => {
    localStorage.clear()

    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'uuid-prueba'),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('muestra el formulario y mantiene la comuna deshabilitada al inicio', () => {
    montarRegistro()

    expect(
      screen.getByRole('heading', {
        name: 'Únete a Jugoseo',
        exact: true,
      }),
    ).toBeInTheDocument()

    const campos = obtenerCampos()

    expect(campos.nombre).toHaveValue('')
    expect(campos.correo).toHaveValue('')
    expect(campos.comuna).toBeDisabled()

    expect(
      screen.getByRole('radio', {
        name: 'Socio VIP',
        exact: true,
      }),
    ).not.toBeChecked()

    expect(
      screen.getByRole('radio', {
        name: 'Radioescucha Oficial',
        exact: true,
      }),
    ).not.toBeChecked()

    expect(
      screen.getByRole('link', {
        name: /Volver a la portada/,
      }),
    ).toHaveAttribute('href', '/')

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('rechaza el envío vacío sin guardar una cuenta', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    await crearCuenta(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Revisa los campos marcados en rojo antes de continuar.',
    )

    const campos = obtenerCampos()

    expect(campos.nombre).toHaveClass('is-invalid')
    expect(campos.apellido).toHaveClass('is-invalid')
    expect(campos.correo).toHaveClass('is-invalid')
    expect(campos.run).toHaveClass('is-invalid')
    expect(campos.password).toHaveClass('is-invalid')

    expect(
      screen.getByText(
        'Selecciona un tipo de registro.',
      ),
    ).toBeInTheDocument()

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBeNull()
  })

  it('valida el nombre al salir del campo y permite corregirlo', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    const { nombre } = obtenerCampos()

    expect(nombre).not.toHaveClass('is-invalid')

    await usuario.click(nombre)
    await usuario.tab()

    expect(nombre).toHaveClass('is-invalid')

    expect(nombre).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    await usuario.type(nombre, 'Ana')
    await usuario.tab()

    expect(nombre).toHaveClass('is-valid')

    expect(nombre).toHaveAttribute(
      'aria-invalid',
      'false',
    )
  })

  it('habilita las comunas y borra la selección al cambiar de región', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    const { region, comuna } = obtenerCampos()

    expect(comuna).toBeDisabled()

    await usuario.selectOptions(
      region,
      regionPrueba,
    )

    expect(comuna).toBeEnabled()

    await usuario.selectOptions(
      comuna,
      comunaPrueba,
    )

    expect(comuna).toHaveValue(comunaPrueba)

    await usuario.selectOptions(
      region,
      regiones[1],
    )

    expect(comuna).toHaveValue('')

    expect(
      screen.getByRole('option', {
        name: 'Selecciona una comuna',
        exact: true,
      }),
    ).toBeInTheDocument()
  })

  it('rechaza un RUN incorrecto y contraseñas que no coinciden', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    const campos = completarFormulario({
      run: '123456784',
      passwordConfirm: 'otra123',
    })

    await crearCuenta(usuario)

    expect(
      screen.getByText(
        'El RUN ingresado tiene un dígito verificador incorrecto.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Las contraseñas no coinciden.',
      ),
    ).toBeInTheDocument()

    expect(campos.run).toHaveClass('is-invalid')

    expect(
      campos.passwordConfirm,
    ).toHaveClass('is-invalid')

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBeNull()
  })

  it('guarda una cuenta válida y limpia el formulario', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    const campos = completarFormulario({
      nombre: '  Ana  ',
      apellido: '  Pérez  ',
      correo: 'REGISTRO.PRUEBAS@GMAIL.COM',
    })

    await crearCuenta(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-success')

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      '¡Listo, Ana! Tu cuenta como Radioescucha Oficial fue creada.',
    )

    const cuentas = JSON.parse(
      localStorage.getItem(CLAVE_USUARIOS),
    )

    expect(cuentas).toHaveLength(1)

    expect(cuentas[0]).toMatchObject({
      id: 'usuario-uuid-prueba',
      versionCuenta: 0,
      nombre: 'Ana',
      apellido: 'Pérez',
      correo: 'registro.pruebas@gmail.com',
      run: '123456785',
      region: regionPrueba,
      comuna: comunaPrueba,
      tipo: 'Radioescucha Oficial',
      rol: 'Cliente',
      password: 'clave123',
      fechaNacimiento: null,
      direccion: null,
    })

    expect(
      Number.isNaN(
        Date.parse(cuentas[0].fechaCreacion),
      ),
    ).toBe(false)

    expect(campos.nombre).toHaveValue('')
    expect(campos.correo).toHaveValue('')
    expect(campos.password).toHaveValue('')
    expect(campos.region).toHaveValue('')
    expect(campos.comuna).toBeDisabled()

    expect(
      screen.getByRole('radio', {
        name: 'Radioescucha Oficial',
        exact: true,
      }),
    ).not.toBeChecked()
  })

  it('rechaza correo y RUN duplicados sin modificar el listado', async () => {
    const usuario = userEvent.setup()

    const contenidoInicial = JSON.stringify([
      {
        id: 'existente',
        correo: 'registro.pruebas@gmail.com',
        run: '123456785',
      },
    ])

    localStorage.setItem(
      CLAVE_USUARIOS,
      contenidoInicial,
    )

    montarRegistro()

    const campos = completarFormulario()

    await crearCuenta(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No se creó la cuenta. Revisa el correo y el RUN ingresados.',
    )

    expect(campos.correo).toHaveClass('is-invalid')
    expect(campos.run).toHaveClass('is-invalid')

    expect(
      screen.getByText(
        'Ya existe una cuenta registrada con este RUN.',
      ),
    ).toBeInTheDocument()

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBe(contenidoInicial)
  })

  it('rechaza un correo reservado por una cuenta de demostración', async () => {
    const usuario = userEvent.setup()

    montarRegistro()

    const campos = completarFormulario({
      correo: 'demo@gmail.com',
    })

    await crearCuenta(usuario)

    expect(campos.correo).toHaveClass('is-invalid')

    expect(
      screen.getByText(
        'Este correo ya está registrado o pertenece a una cuenta de demostración.',
      ),
    ).toBeInTheDocument()

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBeNull()
  })

  it('informa un error si el registro local no contiene un listado válido', async () => {
    const usuario = userEvent.setup()

    const contenidoInvalido = JSON.stringify({
      usuarios: [],
    })

    localStorage.setItem(
      CLAVE_USUARIOS,
      contenidoInvalido,
    )

    montarRegistro()
    completarFormulario()

    await crearCuenta(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No se pudo leer o guardar el registro local.',
    )

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBe(contenidoInvalido)
  })
})