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
import CarritoPanel from '../components/CarritoPanel.jsx'
import { formatearCLP } from '../utils/formatoMoneda.js'

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((consulta) => ({
      matches: false,
      media: consulta,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  })
})

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

function montarPanel(propiedades = {}) {
  const props = {
    mostrar: true,
    cerrar: vi.fn(),
    items: itemsPrueba,
    cambiarCantidad: vi.fn(),
    eliminarProducto: vi.fn(),
    vaciarCarrito: vi.fn(),
    irAPagar: vi.fn(),
    ...propiedades,
  }

  render(<CarritoPanel {...props} />)

  return props
}

describe('CarritoPanel', () => {
  it('muestra los productos, cantidades, subtotales y total', () => {
    montarPanel()

    expect(
      screen.getByRole('dialog', {
        name: 'Tu carrito',
      }),
    ).toBeInTheDocument()

    const nombrePolera = screen.getByText('Polera de prueba')
    const nombreTaza = screen.getByText('Taza de prueba')

    const filaPolera = within(
      nombrePolera.closest('.jugoseo-carrito-item'),
    )

    const filaTaza = within(
      nombreTaza.closest('.jugoseo-carrito-item'),
    )

    expect(
      filaPolera.getByText('2', { exact: true }),
    ).toBeInTheDocument()

    expect(
      filaTaza.getByText('1', { exact: true }),
    ).toBeInTheDocument()

    expect(
      filaPolera.getByText(formatearCLP(2000)),
    ).toBeInTheDocument()

    expect(
      filaTaza.getByText(formatearCLP(3000)),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Total', { exact: true }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(5000)),
    ).toBeInTheDocument()
  })

  it('muestra el carrito vacío y deshabilita el botón para vaciarlo', () => {
    montarPanel({ items: [] })

    expect(
      screen.getByText('Tu carrito está vacío.'),
    ).toBeInTheDocument()

    expect(
      screen.getByText(formatearCLP(0)),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Vaciar carrito',
        exact: true,
      }),
    ).toBeDisabled()
  })

  it('envía el identificador y la variación al cambiar cantidades o eliminar', async () => {
    const usuario = userEvent.setup()

    const {
      cambiarCantidad,
      eliminarProducto,
    } = montarPanel()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Restar una unidad de Polera de prueba',
        exact: true,
      }),
    )

    expect(cambiarCantidad).toHaveBeenNthCalledWith(
      1,
      1,
      -1,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Sumar una unidad de Polera de prueba',
        exact: true,
      }),
    )

    expect(cambiarCantidad).toHaveBeenNthCalledWith(
      2,
      1,
      1,
    )

    await usuario.click(
      screen.getByRole('button', {
        name: 'Eliminar Taza de prueba',
        exact: true,
      }),
    )

    expect(eliminarProducto).toHaveBeenCalledTimes(1)
    expect(eliminarProducto).toHaveBeenCalledWith(2)
  })

  it('ejecuta las acciones de cerrar, pagar y vaciar el carrito', async () => {
    const usuario = userEvent.setup()

    const {
      cerrar,
      irAPagar,
      vaciarCarrito,
    } = montarPanel()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Cerrar carrito',
        exact: true,
      }),
    )

    expect(cerrar).toHaveBeenCalledTimes(1)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Ir a pagar',
        exact: true,
      }),
    )

    expect(irAPagar).toHaveBeenCalledTimes(1)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Vaciar carrito',
        exact: true,
      }),
    )

    expect(vaciarCarrito).toHaveBeenCalledTimes(1)
  })

  it('muestra los conflictos y bloquea el aumento del artículo y el pago', async () => {
    const usuario = userEvent.setup()

    const {
      cambiarCantidad,
      irAPagar,
    } = montarPanel({
      conflictos: {
        1: 'La cantidad supera el stock disponible.',
      },
    })

    expect(
      screen.getByText(
        'La cantidad supera el stock disponible.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Total provisional'),
    ).toBeInTheDocument()

    const botonSumarPolera = screen.getByRole('button', {
      name: 'Sumar una unidad de Polera de prueba',
      exact: true,
    })

    const botonPagar = screen.getByRole('button', {
      name: 'Ir a pagar',
      exact: true,
    })

    expect(botonSumarPolera).toBeDisabled()
    expect(botonPagar).toBeDisabled()

    expect(
      screen.getByRole('button', {
        name: 'Restar una unidad de Polera de prueba',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.getByRole('button', {
        name: 'Eliminar Polera de prueba',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.getByRole('button', {
        name: 'Sumar una unidad de Taza de prueba',
        exact: true,
      }),
    ).toBeEnabled()

    await usuario.click(botonSumarPolera)
    await usuario.click(botonPagar)

    expect(cambiarCantidad).not.toHaveBeenCalled()
    expect(irAPagar).not.toHaveBeenCalled()
  })

  it('muestra el error de carga y bloquea las acciones del carrito', () => {
    montarPanel({
      errorCarga: 'No se pudieron cargar los productos.',
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudieron cargar los productos.',
    )

    expect(
      screen.getByText('Total provisional'),
    ).toBeInTheDocument()

    const nombresBotones = [
      'Restar una unidad de Polera de prueba',
      'Sumar una unidad de Polera de prueba',
      'Eliminar Polera de prueba',
      'Restar una unidad de Taza de prueba',
      'Sumar una unidad de Taza de prueba',
      'Eliminar Taza de prueba',
      'Ir a pagar',
      'Vaciar carrito',
    ]

    for (const nombre of nombresBotones) {
      expect(
        screen.getByRole('button', {
          name: nombre,
          exact: true,
        }),
      ).toBeDisabled()
    }

    expect(
      screen.getByRole('button', {
        name: 'Cerrar carrito',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('muestra el aviso y la lista de actualizaciones del carrito', () => {
    montarPanel({
      aviso: {
        tipo: 'success',
        texto: 'Producto agregado al carrito.',
      },
      cambios: [
        'Se actualizó el precio de la polera.',
        'Se actualizó el stock de la taza.',
      ],
    })

    const mensajes = screen.getAllByRole('status')

    expect(mensajes).toHaveLength(2)

    expect(mensajes[0]).toHaveTextContent(
      'Producto agregado al carrito.',
    )

    expect(mensajes[0]).toHaveClass('alert-success')

    expect(mensajes[1]).toHaveTextContent(
      'Revisa las actualizaciones del carrito:',
    )

    expect(
      within(mensajes[1]).getAllByRole('listitem'),
    ).toHaveLength(2)

    expect(mensajes[1]).toHaveTextContent(
      'Se actualizó el precio de la polera.',
    )

    expect(mensajes[1]).toHaveTextContent(
      'Se actualizó el stock de la taza.',
    )
  })

  it('permite reiniciar el carrito cuando existe un error de carrito', async () => {
    const usuario = userEvent.setup()

    const { vaciarCarrito } = montarPanel({
      items: [],
      errorCarga: 'No fue posible recuperar el carrito.',
      errorCarrito: 'Datos del carrito no válidos.',
    })

    expect(
      screen.queryByText('Tu carrito está vacío.'),
    ).not.toBeInTheDocument()

    const botonReiniciar = screen.getByRole('button', {
      name: 'Reiniciar carrito',
      exact: true,
    })

    expect(botonReiniciar).toBeEnabled()

    await usuario.click(botonReiniciar)

    expect(vaciarCarrito).toHaveBeenCalledTimes(1)
  })
})