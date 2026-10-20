import {
  act,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import HistorialPedidos from '../components/HistorialPedidos.jsx'

import {
  cancelarPedido,
  obtenerPedidosPropios,
} from '../utils/pedidosStorage.js'

import { formatearCLP } from '../utils/formatoMoneda.js'

vi.mock('../utils/pedidosStorage.js', () => ({
  cancelarPedido: vi.fn(),
  obtenerPedidosPropios: vi.fn(),
}))

function crearPedido(cambios = {}) {
  return {
    id: 101,
    estado: 'Pendiente',
    fechaCreacion: '2026-10-01T12:00:00.000Z',
    fechaActualizacion: '2026-10-01T12:00:00.000Z',
    total: 5000,
    articulos: [
      {
        id: 1,
        nombre: 'Polera de prueba',
        cantidad: 2,
        subtotal: 5000,
      },
    ],
    ...cambios,
  }
}

describe('HistorialPedidos', () => {
  beforeEach(() => {
    obtenerPedidosPropios.mockReset()
    obtenerPedidosPropios.mockReturnValue([])

    cancelarPedido.mockReset()
    cancelarPedido.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el mensaje cuando no existen pedidos', () => {
    render(<HistorialPedidos />)

    expect(
      screen.getByRole('heading', {
        name: 'Mis pedidos',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Todavía no tienes pedidos registrados.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()
  })

  it('muestra un error si no puede cargar el historial', () => {
    obtenerPedidosPropios.mockImplementation(() => {
      throw new Error('Error simulado de lectura')
    })

    render(<HistorialPedidos />)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar tu historial. Inténtalo nuevamente.',
    )

    expect(
      screen.queryByText(
        'Todavía no tienes pedidos registrados.',
      ),
    ).not.toBeInTheDocument()
  })

  it('muestra el pedido y permite abrir y ocultar su detalle', async () => {
    const usuario = userEvent.setup()

    obtenerPedidosPropios.mockReturnValue([
      crearPedido({
        estado: 'Cancelado',
        motivoCancelacion: 'Compra duplicada.',
      }),
    ])

    render(<HistorialPedidos />)

    expect(
      screen.getByRole('heading', {
        name: 'Pedido #101',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Cancelado', { exact: true }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(5000)),
    ).toBeInTheDocument()

    const botonDetalle = screen.getByRole('button', {
      name: 'Ver detalle',
      exact: true,
    })

    expect(botonDetalle).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    expect(
      screen.queryByText('Polera de prueba × 2'),
    ).not.toBeInTheDocument()

    await usuario.click(botonDetalle)

    expect(
      screen.getByText('Polera de prueba × 2'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Motivo de cancelación: Compra duplicada.',
      ),
    ).toBeInTheDocument()

    const botonOcultar = screen.getByRole('button', {
      name: 'Ocultar detalle',
      exact: true,
    })

    expect(botonOcultar).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await usuario.click(botonOcultar)

    expect(
      screen.queryByText('Polera de prueba × 2'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Ver detalle',
        exact: true,
      }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('ofrece cancelar solo en los estados permitidos', () => {
    const estados = [
      'Pendiente',
      'En preparación',
      'Enviado',
      'Entregado',
      'Cancelado',
    ]

    obtenerPedidosPropios.mockReturnValue(
      estados.map((estado, indice) =>
        crearPedido({
          id: 101 + indice,
          estado,
        }),
      ),
    )

    render(<HistorialPedidos />)

    const tarjetas = screen.getAllByRole('article')

    expect(tarjetas).toHaveLength(5)

    tarjetas.forEach((tarjeta, indice) => {
      const botonCancelar = within(tarjeta).queryByRole(
        'button',
        {
          name: 'Cancelar pedido',
          exact: true,
        },
      )

      if (indice < 3) {
        expect(botonCancelar).toBeEnabled()
      } else {
        expect(botonCancelar).not.toBeInTheDocument()
      }
    })
  })

  it('cancela con el motivo ingresado y actualiza el historial', async () => {
    const usuario = userEvent.setup()
    const pedido = crearPedido()

    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValue('Compra duplicada.')

    obtenerPedidosPropios.mockReturnValue([pedido])

    cancelarPedido.mockImplementation(async () => {
      obtenerPedidosPropios.mockReturnValue([
        {
          ...pedido,
          estado: 'Cancelado',
          motivoCancelacion: 'Compra duplicada.',
        },
      ])
    })

    render(<HistorialPedidos />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    )

    expect(prompt).toHaveBeenCalledTimes(1)

    expect(cancelarPedido).toHaveBeenCalledWith(
      101,
      'Compra duplicada.',
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'El pedido #101 fue cancelado.',
    )

    expect(
      screen.getByText('Cancelado', { exact: true }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('no cancela el pedido si se cierra el diálogo del motivo', async () => {
    const usuario = userEvent.setup()

    vi.spyOn(window, 'prompt').mockReturnValue(null)

    obtenerPedidosPropios.mockReturnValue([
      crearPedido(),
    ])

    render(<HistorialPedidos />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    )

    expect(cancelarPedido).not.toHaveBeenCalled()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('muestra el mensaje correspondiente si el pedido ya no puede cancelarse', async () => {
    const usuario = userEvent.setup()

    vi.spyOn(window, 'prompt').mockReturnValue('')

    obtenerPedidosPropios.mockReturnValue([
      crearPedido(),
    ])

    cancelarPedido.mockRejectedValue({
      codigo: 'PEDIDO_NO_CANCELABLE',
    })

    render(<HistorialPedidos />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'El pedido ya no puede cancelarse. Revisa su estado actual.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')

    expect(
      screen.getByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('bloquea las cancelaciones mientras una operación está pendiente', async () => {
    const usuario = userEvent.setup()

    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValue('')

    obtenerPedidosPropios.mockReturnValue([
      crearPedido({ id: 101 }),
      crearPedido({ id: 102 }),
    ])

    let resolverCancelacion

    cancelarPedido.mockImplementation(
      () => new Promise((resolve) => {
        resolverCancelacion = resolve
      }),
    )

    render(<HistorialPedidos />)

    const botonesIniciales = screen.getAllByRole(
      'button',
      {
        name: 'Cancelar pedido',
        exact: true,
      },
    )

    await usuario.click(botonesIniciales[0])

    const botonCancelando = screen.getByRole(
      'button',
      {
        name: 'Cancelando…',
        exact: true,
      },
    )

    const botonOtroPedido = screen.getByRole(
      'button',
      {
        name: 'Cancelar pedido',
        exact: true,
      },
    )

    expect(botonCancelando).toBeDisabled()

    expect(botonCancelando).toHaveAttribute(
      'aria-busy',
      'true',
    )

    expect(botonOtroPedido).toBeDisabled()

    await usuario.click(botonOtroPedido)

    expect(cancelarPedido).toHaveBeenCalledTimes(1)
    expect(prompt).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolverCancelacion()
    })

    await waitFor(() => {
      const botones = screen.getAllByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      })

      botones.forEach((boton) => {
        expect(boton).toBeEnabled()
      })
    })

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'El pedido #101 fue cancelado.',
    )
  })
})