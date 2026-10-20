import {
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

import Portada from '../components/Portada.jsx'

vi.mock('../components/CarruselInicio.jsx', () => ({
  default: function CarruselSimulado() {
    return (
      <section aria-label="Carrusel de prueba">
        Contenido del carrusel
      </section>
    )
  },
}))

vi.mock('../components/LoginModal.jsx', () => ({
  default: function LoginModalSimulado({
    mostrar,
    cerrar,
  }) {
    if (!mostrar) {
      return null
    }

    return (
      <div
        role="dialog"
        aria-label="Inicio de sesión de prueba"
      >
        <p>Formulario de acceso de prueba</p>

        <button
          type="button"
          onClick={cerrar}
        >
          Cerrar modal de prueba
        </button>
      </div>
    )
  },
}))

describe('Portada', () => {
  it('muestra la marca, el mensaje y el carrusel sin abrir el login', () => {
    render(<Portada />)

    expect(
      screen.getByText('JUGOSEO', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('.com', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'La radio online que suena sin parar',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      }),
    ).toBeEnabled()

    const contenido = screen.getByRole('main')

    expect(
      within(contenido).getByRole('region', {
        name: 'Carrusel de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('abre el modal al pulsar Iniciar sesión', async () => {
    const usuario = userEvent.setup()

    render(<Portada />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Inicio de sesión de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Formulario de acceso de prueba',
      ),
    ).toBeInTheDocument()
  })

  it('cierra el modal mediante la función recibida y permite abrirlo nuevamente', async () => {
    const usuario = userEvent.setup()

    render(<Portada />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Inicio de sesión de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar modal de prueba',
        exact: true,
      }),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('region', {
        name: 'Carrusel de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Iniciar sesión',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Inicio de sesión de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()
  })
})