import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import ConfirmarPedidoModal from '../components/ConfirmarPedidoModal.jsx'

import { formatearCLP } from '../utils/formatoMoneda.js'

const itemsPrueba = [
  {
    id: 1,
    nombre: 'Polera de prueba',
    precio: 1000,
    cantidad: 2,
  },
  {
    id: 2,
    nombre: 'Taza de prueba',
    precio: 3000,
    cantidad: 1,
  },
]

describe('ConfirmarPedidoModal', () => {
  it('muestra los artículos, cantidades, subtotales y total', () => {
    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={vi.fn()}
        confirmar={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Confirmar pedido',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Polera de prueba × 2'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Taza de prueba × 1'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(2000)),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(3000)),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(5000)),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('solicita el cierre al pulsar Cancelar o Cerrar', async () => {
    const usuario = userEvent.setup()
    const cerrar = vi.fn()

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={cerrar}
        confirmar={vi.fn()}
      />,
    )

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
  })

  it('ejecuta la confirmación y recupera los controles cuando tiene éxito', async () => {
    const usuario = userEvent.setup()

    const confirmar = vi.fn().mockResolvedValue({
      ok: true,
    })

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={vi.fn()}
        confirmar={confirmar}
      />,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    await waitFor(() => {
      expect(confirmar).toHaveBeenCalledTimes(1)

      expect(
        screen.getByRole('button', {
          name: 'Confirmar pedido',
          exact: true,
        }),
      ).toBeEnabled()
    })

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('muestra el mensaje recibido cuando la confirmación no es válida', async () => {
    const usuario = userEvent.setup()

    const confirmar = vi.fn().mockResolvedValue({
      ok: false,
      mensaje: 'El carrito cambió. Revisa sus artículos.',
    })

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={vi.fn()}
        confirmar={confirmar}
      />,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'El carrito cambió. Revisa sus artículos.',
    )

    expect(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('muestra un error genérico si la confirmación lanza una excepción', async () => {
    const usuario = userEvent.setup()

    const confirmar = vi.fn().mockRejectedValue(
      new Error('Error simulado'),
    )

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={vi.fn()}
        confirmar={confirmar}
      />,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'No se pudo confirmar el pedido. Inténtalo nuevamente.',
    )

    expect(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('bloquea los controles y el cierre mientras espera la confirmación', async () => {
    const usuario = userEvent.setup()
    const cerrar = vi.fn()

    let resolverConfirmacion

    const confirmar = vi.fn(() =>
      new Promise((resolve) => {
        resolverConfirmacion = resolve
      }),
    )

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={cerrar}
        confirmar={confirmar}
      />,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    const botonConfirmando = screen.getByRole('button', {
      name: 'Confirmando…',
      exact: true,
    })

    expect(botonConfirmando).toBeDisabled()

    expect(botonConfirmando).toHaveAttribute(
      'aria-busy',
      'true',
    )

    expect(
      screen.getByRole('button', {
        name: 'Cancelar',
        exact: true,
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('button', {
        name: 'Cerrar',
        exact: true,
      }),
    ).toBeDisabled()

    await usuario.click(botonConfirmando)
    await usuario.keyboard('{Escape}')

    expect(confirmar).toHaveBeenCalledTimes(1)
    expect(cerrar).not.toHaveBeenCalled()

    await act(async () => {
      resolverConfirmacion({ ok: true })
    })

    expect(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.getByRole('button', {
        name: 'Cancelar',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('permite reintentar y limpia el error anterior', async () => {
    const usuario = userEvent.setup()

    const confirmar = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        mensaje: 'Primer intento rechazado.',
      })
      .mockResolvedValueOnce({
        ok: true,
      })

    render(
      <ConfirmarPedidoModal
        items={itemsPrueba}
        cerrar={vi.fn()}
        confirmar={confirmar}
      />,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Primer intento rechazado.')

    await usuario.click(
      screen.getByRole('button', {
        name: 'Confirmar pedido',
        exact: true,
      }),
    )

    await waitFor(() => {
      expect(confirmar).toHaveBeenCalledTimes(2)

      expect(
        screen.queryByRole('alert'),
      ).not.toBeInTheDocument()

      expect(
        screen.getByRole('button', {
          name: 'Confirmar pedido',
          exact: true,
        }),
      ).toBeEnabled()
    })
  })
})