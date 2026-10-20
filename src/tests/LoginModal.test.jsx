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
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import LoginModal from '../components/LoginModal.jsx'

import {
  buscarCuentaPorCorreo,
} from '../utils/cuentasLectura.js'

vi.mock('../utils/cuentasLectura.js', () => ({
  buscarCuentaPorCorreo: vi.fn(),
}))

function RutaActual() {
  const ubicacion = useLocation()

  return (
    <div data-testid="ruta-actual">
      {ubicacion.pathname}
    </div>
  )
}

function montarLogin() {
  const cerrar = vi.fn()

  render(
    <MemoryRouter initialEntries={['/']}>
      <LoginModal
        mostrar
        cerrar={cerrar}
      />

      <RutaActual />
    </MemoryRouter>,
  )

  return { cerrar }
}

function obtenerCampos() {
  return {
    correo: screen.getByLabelText(
      'Correo electrónico',
      { exact: true },
    ),
    password: screen.getByLabelText(
      'Contraseña (4 a 10 caracteres)',
      { exact: true },
    ),
  }
}

async function completarLogin(
  usuario,
  correo = 'ana@gmail.com',
  password = 'clave123',
) {
  const campos = obtenerCampos()

  await usuario.type(campos.correo, correo)
  await usuario.type(campos.password, password)
}

async function pulsarEntrar(usuario) {
  await usuario.click(
    screen.getByRole('button', {
      name: 'Entrar',
      exact: true,
    }),
  )
}

function crearCuenta(cambios = {}) {
  return {
    id: 'cuenta-101',
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@gmail.com',
    password: 'clave123',
    rol: 'Cliente',
    tipo: 'Registrado',
    versionCuenta: 2,
    ...cambios,
  }
}

describe('LoginModal', () => {
  beforeEach(() => {
    sessionStorage.clear()

    buscarCuentaPorCorreo.mockReset()
    buscarCuentaPorCorreo.mockReturnValue(null)
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra el formulario y permite solicitar el cierre', async () => {
    const usuario = userEvent.setup()
    const { cerrar } = montarLogin()

    expect(
      screen.getByRole('dialog', {
        name: 'Iniciar sesión',
      }),
    ).toBeInTheDocument()

    const campos = obtenerCampos()

    expect(campos.correo).toHaveValue('')
    expect(campos.password).toHaveValue('')

    expect(campos.password).toHaveAttribute(
      'type',
      'password',
    )

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar',
        exact: true,
      }),
    )

    expect(cerrar).toHaveBeenCalledTimes(1)
  })

  it('rechaza los campos vacíos sin buscar una cuenta', async () => {
    const usuario = userEvent.setup()

    montarLogin()

    await pulsarEntrar(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Revisa los campos marcados en rojo',
    )

    const campos = obtenerCampos()

    expect(campos.correo).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    expect(campos.password).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    expect(
      screen.getByText('Ingrese su contraseña'),
    ).toBeInTheDocument()

    expect(
      buscarCuentaPorCorreo,
    ).not.toHaveBeenCalled()

    expect(
      sessionStorage.getItem('jugoseoUsuario'),
    ).toBeNull()
  })

  it('rechaza una contraseña demasiado corta', async () => {
    const usuario = userEvent.setup()

    montarLogin()

    await completarLogin(
      usuario,
      'ana@gmail.com',
      '123',
    )

    await pulsarEntrar(usuario)

    expect(
      screen.getByText(
        'La contraseña debe tener entre 4 y 10 caracteres',
      ),
    ).toBeInTheDocument()

    expect(
      obtenerCampos().password,
    ).toHaveClass('is-invalid')

    expect(
      buscarCuentaPorCorreo,
    ).not.toHaveBeenCalled()
  })

  it('rechaza un correo con dominio no permitido', async () => {
    const usuario = userEvent.setup()

    montarLogin()

    await completarLogin(
      usuario,
      'ana@example.com',
    )

    await pulsarEntrar(usuario)

    expect(
      obtenerCampos().correo,
    ).toHaveClass('is-invalid')

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Revisa los campos marcados en rojo',
    )

    expect(
      buscarCuentaPorCorreo,
    ).not.toHaveBeenCalled()
  })

  it('rechaza el acceso cuando la cuenta no existe', async () => {
    const usuario = userEvent.setup()
    const { cerrar } = montarLogin()

    await completarLogin(usuario)
    await pulsarEntrar(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Correo o contraseña incorrectos',
    )

    expect(
      buscarCuentaPorCorreo,
    ).toHaveBeenCalledWith('ana@gmail.com')

    expect(cerrar).not.toHaveBeenCalled()

    expect(
      sessionStorage.getItem('jugoseoUsuario'),
    ).toBeNull()

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/$/)
  })

  it('rechaza una contraseña que no coincide con la cuenta', async () => {
    const usuario = userEvent.setup()

    buscarCuentaPorCorreo.mockReturnValue(
      crearCuenta(),
    )

    montarLogin()

    await completarLogin(
      usuario,
      'ana@gmail.com',
      'otra123',
    )

    await pulsarEntrar(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Correo o contraseña incorrectos',
    )

    expect(
      sessionStorage.getItem('jugoseoUsuario'),
    ).toBeNull()
  })

  it('guarda la sesión, cierra el modal y navega al inicio', async () => {
    const usuario = userEvent.setup()

    buscarCuentaPorCorreo.mockReturnValue(
      crearCuenta(),
    )

    const { cerrar } = montarLogin()

    await completarLogin(
      usuario,
      '  ANA@GMAIL.COM  ',
    )

    await pulsarEntrar(usuario)

    expect(
      buscarCuentaPorCorreo,
    ).toHaveBeenCalledWith('ana@gmail.com')

    const sesion = JSON.parse(
      sessionStorage.getItem('jugoseoUsuario'),
    )

    expect(sesion).toEqual({
      usuario: 'Ana Pérez',
      correo: 'ana@gmail.com',
      rol: 'Cliente',
      tipo: 'Registrado',
      cuentaId: 'cuenta-101',
      versionCuenta: 2,
    })

    expect(sesion).not.toHaveProperty('password')

    expect(cerrar).toHaveBeenCalledTimes(1)

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/app\/inicio$/)
  })

  it('rechaza una cuenta interna con un dominio incompatible', async () => {
    const usuario = userEvent.setup()

    buscarCuentaPorCorreo.mockReturnValue(
      crearCuenta({
        rol: 'Administrador',
      }),
    )

    const { cerrar } = montarLogin()

    await completarLogin(usuario)
    await pulsarEntrar(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Las cuentas Locutor y Administrador deben utilizar un correo @jugoseo.com.',
    )

    expect(cerrar).not.toHaveBeenCalled()

    expect(
      sessionStorage.getItem('jugoseoUsuario'),
    ).toBeNull()
  })

  it('muestra un error si falla la consulta de la cuenta', async () => {
    const usuario = userEvent.setup()

    buscarCuentaPorCorreo.mockImplementation(() => {
      throw new Error('Error simulado de lectura')
    })

    montarLogin()

    await completarLogin(usuario)
    await pulsarEntrar(usuario)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No se pudo iniciar sesión. Inténtalo nuevamente.',
    )

    expect(
      sessionStorage.getItem('jugoseoUsuario'),
    ).toBeNull()
  })

  it('cierra el modal y navega al registro desde el enlace', async () => {
    const usuario = userEvent.setup()
    const { cerrar } = montarLogin()

    const enlace = screen.getByRole('link', {
      name: 'Regístrate aquí',
      exact: true,
    })

    expect(enlace).toHaveAttribute(
      'href',
      '/registro',
    )

    await usuario.click(enlace)

    expect(cerrar).toHaveBeenCalledTimes(1)

    expect(
      screen.getByTestId('ruta-actual'),
    ).toHaveTextContent(/^\/registro$/)
  })
})