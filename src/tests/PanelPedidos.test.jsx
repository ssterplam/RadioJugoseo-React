import {
  act,
  fireEvent,
  render,
  screen,
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

import PanelPedidos from '../components/PanelPedidos.jsx'

import {
  cancelarPedido,
  cambiarEstadoPedido,
  obtenerPedidosAdministrables,
  obtenerSiguienteEstado,
} from '../utils/pedidosStorage.js'

import {
  formatearCLP,
} from '../utils/formatoMoneda.js'

vi.mock('../utils/pedidosStorage.js', () => ({
  cancelarPedido: vi.fn(),
  cambiarEstadoPedido: vi.fn(),
  obtenerPedidosAdministrables: vi.fn(),
  obtenerSiguienteEstado: vi.fn(),
}))

function crearPedido(cambios = {}) {
  return {
    id: 101,
    correoCliente: 'ana@gmail.com',
    estado: 'Pendiente',
    fechaCreacion: '2026-10-01T12:00:00.000Z',
    fechaActualizacion: '2026-10-01T12:00:00.000Z',
    total: 5000,
    articulos: [
      {
        id: 'producto-uno',
        nombre: 'Polera de prueba',
        precio: 2500,
        cantidad: 2,
        subtotal: 5000,
      },
    ],
    ...cambios,
  }
}

function boton(nombre) {
  return screen.getByRole('button', {
    name: nombre,
    exact: true,
  })
}

function montarPanel(pedidos = [crearPedido()]) {
  obtenerPedidosAdministrables.mockReturnValue(
    pedidos,
  )

  render(<PanelPedidos />)
}

const operaciones = [
  {
    accion: 'avanzar',
    nombreBoton: 'Pasar a En preparación',
    textoEspera: 'Actualizando…',
  },
  {
    accion: 'cancelar',
    nombreBoton: 'Cancelar pedido',
    textoEspera: 'Cancelando…',
  },
]

describe('PanelPedidos', () => {
  beforeEach(() => {
    obtenerPedidosAdministrables.mockReset()
    obtenerPedidosAdministrables.mockReturnValue([])

    obtenerSiguienteEstado.mockReset()
    obtenerSiguienteEstado.mockImplementation(
      (estado) => ({
        Pendiente: 'En preparación',
        'En preparación': 'Enviado',
        Enviado: 'Entregado',
      })[estado] || null,
    )

    cambiarEstadoPedido.mockReset()
    cambiarEstadoPedido.mockResolvedValue(undefined)

    cancelarPedido.mockReset()
    cancelarPedido.mockResolvedValue(undefined)

    vi.spyOn(window, 'confirm')
      .mockReturnValue(true)

    vi.spyOn(window, 'prompt')
      .mockReturnValue('Motivo de prueba.')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el mensaje cuando no existen pedidos', () => {
    montarPanel([])

    expect(
      screen.getByRole('heading', {
        name: 'Gestión de pedidos',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'No hay pedidos registrados.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()
  })

  it('muestra el error si falla la carga de pedidos', () => {
    obtenerPedidosAdministrables.mockImplementation(
      () => {
        throw new Error('Error simulado de lectura')
      },
    )

    render(<PanelPedidos />)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar la lista de pedidos. Inténtalo nuevamente.',
    )

    expect(
      screen.queryByText(
        'No hay pedidos registrados.',
      ),
    ).not.toBeInTheDocument()
  })

  it('ordena los pedidos y permite abrir y ocultar el detalle', async () => {
    const usuario = userEvent.setup()

    montarPanel([
      crearPedido({ id: 101 }),
      crearPedido({
        id: 202,
        estado: 'Cancelado',
        motivoCancelacion: 'Compra duplicada.',
      }),
    ])

    const tarjetas = screen.getAllByRole('article')

    expect(
      within(tarjetas[0]).getByRole('heading', {
        name: 'Pedido #202',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      within(tarjetas[1]).getByRole('heading', {
        name: 'Pedido #101',
        exact: true,
      }),
    ).toBeInTheDocument()

    const tarjeta = within(tarjetas[0])

    expect(
      tarjeta.getByText(
        'Cliente: ana@gmail.com',
      ),
    ).toBeInTheDocument()

    expect(
      tarjeta.queryByRole('table'),
    ).not.toBeInTheDocument()

    await usuario.click(
      tarjeta.getByRole('button', {
        name: 'Ver detalle',
        exact: true,
      }),
    )

    const ocultar = tarjeta.getByRole('button', {
      name: 'Ocultar detalle',
      exact: true,
    })

    expect(ocultar).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    expect(ocultar).toHaveAttribute(
      'aria-controls',
      'detalle-pedido-admin-202',
    )

    const tabla = within(
      tarjeta.getByRole('table'),
    )

    const filas = tabla.getAllByRole('row')

    expect(filas).toHaveLength(2)

    const celdas = within(
      filas[1],
    ).getAllByRole('cell')

    expect(
      celdas.map((celda) => celda.textContent),
    ).toEqual([
      'Polera de prueba',
      formatearCLP(2500),
      '2',
      formatearCLP(5000),
    ])

    expect(
      tarjeta.getByText(
        'Motivo de cancelación: Compra duplicada.',
      ),
    ).toBeInTheDocument()

    await usuario.click(ocultar)

    expect(
      tarjeta.queryByRole('table'),
    ).not.toBeInTheDocument()

    expect(
      tarjeta.getByRole('button', {
        name: 'Ver detalle',
        exact: true,
      }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('avanza el estado después de confirmar y actualiza la vista', async () => {
    const usuario = userEvent.setup()
    const pedido = crearPedido()

    montarPanel([pedido])

    cambiarEstadoPedido.mockImplementation(
      async () => {
        obtenerPedidosAdministrables.mockReturnValue([
          {
            ...pedido,
            estado: 'En preparación',
          },
        ])
      },
    )

    await usuario.click(
      boton('Pasar a En preparación'),
    )

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Cambiar el pedido #101 de "Pendiente" a "En preparación"?',
    )

    expect(
      cambiarEstadoPedido,
    ).toHaveBeenCalledWith(
      101,
      'En preparación',
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'El pedido #101 cambió a "En preparación".',
    )

    expect(
      screen.getByText('En preparación', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      boton('Pasar a Enviado'),
    ).toBeEnabled()
  })

  it('no cambia el estado si se rechaza la confirmación', async () => {
    const usuario = userEvent.setup()

    window.confirm.mockReturnValue(false)

    montarPanel()

    await usuario.click(
      boton('Pasar a En preparación'),
    )

    expect(
      cambiarEstadoPedido,
    ).not.toHaveBeenCalled()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('cancela con el motivo ingresado y actualiza la vista', async () => {
    const usuario = userEvent.setup()
    const pedido = crearPedido()

    montarPanel([pedido])

    cancelarPedido.mockImplementation(
      async () => {
        obtenerPedidosAdministrables.mockReturnValue([
          {
            ...pedido,
            estado: 'Cancelado',
            motivoCancelacion: 'Motivo de prueba.',
          },
        ])
      },
    )

    await usuario.click(
      boton('Cancelar pedido'),
    )

    expect(window.prompt).toHaveBeenCalledTimes(1)

    expect(
      cancelarPedido,
    ).toHaveBeenCalledWith(
      101,
      'Motivo de prueba.',
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'El pedido #101 fue cancelado.',
    )

    expect(
      screen.getByText('Cancelado', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Cancelar pedido',
        exact: true,
      }),
    ).not.toBeInTheDocument()
  })

  it('no cancela si se cierra el diálogo del motivo', async () => {
    const usuario = userEvent.setup()

    window.prompt.mockReturnValue(null)

    montarPanel()

    await usuario.click(
      boton('Cancelar pedido'),
    )

    expect(
      cancelarPedido,
    ).not.toHaveBeenCalled()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it.each(operaciones)(
    'muestra el error correspondiente al fallar la operación de $accion',
    async ({ accion, nombreBoton }) => {
      const usuario = userEvent.setup()

      montarPanel()

      const funcion =
        accion === 'avanzar'
          ? cambiarEstadoPedido
          : cancelarPedido

      funcion.mockRejectedValue({
        codigo: 'OPERACION_NO_PERMITIDA',
      })

      await usuario.click(
        boton(nombreBoton),
      )

      expect(
        await screen.findByRole('status'),
      ).toHaveTextContent(
        'No tienes permiso para realizar esta operación.',
      )

      expect(
        screen.getByRole('status'),
      ).toHaveClass('alert-danger')

      expect(
        boton(nombreBoton),
      ).toBeEnabled()
    },
  )

  it.each(operaciones)(
    'bloquea las acciones durante la operación pendiente de $accion',
    async ({
      accion,
      nombreBoton,
      textoEspera,
    }) => {
      const usuario = userEvent.setup()

      montarPanel()

      let resolverOperacion

      const funcion =
        accion === 'avanzar'
          ? cambiarEstadoPedido
          : cancelarPedido

      funcion.mockImplementation(
        () => new Promise((resolve) => {
          resolverOperacion = resolve
        }),
      )

      await usuario.click(
        boton(nombreBoton),
      )

      const botonEspera = boton(textoEspera)

      expect(botonEspera).toBeDisabled()

      expect(botonEspera).toHaveAttribute(
        'aria-busy',
        'true',
      )

      expect(
        boton('Actualizar'),
      ).toBeDisabled()

      const otraAccion =
        accion === 'avanzar'
          ? 'Cancelar pedido'
          : 'Pasar a En preparación'

      expect(
        boton(otraAccion),
      ).toBeDisabled()

      await usuario.click(botonEspera)
      await usuario.click(boton(otraAccion))

      expect(funcion).toHaveBeenCalledTimes(1)

      const otraFuncion =
        accion === 'avanzar'
          ? cancelarPedido
          : cambiarEstadoPedido

      expect(
        otraFuncion,
      ).not.toHaveBeenCalled()

      await act(async () => {
        resolverOperacion()
      })

      expect(
        boton('Actualizar'),
      ).toBeEnabled()

      expect(
        boton(nombreBoton),
      ).toBeEnabled()

      expect(
        boton(otraAccion),
      ).toBeEnabled()
    },
  )

  it('recarga mediante Actualizar, foco y cambios relevantes de almacenamiento', async () => {
    const usuario = userEvent.setup()

    montarPanel([])

    obtenerPedidosAdministrables.mockReturnValue([
      crearPedido(),
    ])

    await usuario.click(
      boton('Actualizar'),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Pedido #101',
        exact: true,
      }),
    ).toBeInTheDocument()

    obtenerPedidosAdministrables.mockReturnValue([])

    fireEvent(
      window,
      new Event('focus'),
    )

    expect(
      screen.getByText(
        'No hay pedidos registrados.',
      ),
    ).toBeInTheDocument()

    const llamadas =
      obtenerPedidosAdministrables.mock.calls.length

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'otraClave',
      }),
    )

    expect(
      obtenerPedidosAdministrables,
    ).toHaveBeenCalledTimes(llamadas)

    for (const key of [
      'jugoseoComercio',
      'jugoseoPedidos',
      'jugoseoProductos',
      null,
    ]) {
      obtenerPedidosAdministrables.mockClear()

      fireEvent(
        window,
        new StorageEvent('storage', {
          key,
        }),
      )

      expect(
        obtenerPedidosAdministrables,
      ).toHaveBeenCalledTimes(1)
    }
  })

  it('no ofrece avanzar ni cancelar pedidos entregados o cancelados', () => {
    montarPanel([
      crearPedido({
        id: 101,
        estado: 'Entregado',
      }),
      crearPedido({
        id: 202,
        estado: 'Cancelado',
      }),
    ])

    const tarjetas = screen.getAllByRole('article')

    expect(tarjetas).toHaveLength(2)

    for (const tarjeta of tarjetas) {
      expect(
        within(tarjeta).getAllByRole('button'),
      ).toHaveLength(1)

      expect(
        within(tarjeta).getByRole('button', {
          name: 'Ver detalle',
          exact: true,
        }),
      ).toBeEnabled()
    }
  })
})