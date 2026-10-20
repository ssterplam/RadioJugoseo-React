import {
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

import Tienda from '../components/Tienda.jsx'

import {
  guardarCarrito,
  reiniciarCarritoDanado,
} from '../utils/carritoStorage.js'

import {
  conBloqueoComercio,
} from '../utils/comercioStorage.js'

import {
  leerEstadoTienda,
  reconciliarCarrito,
} from '../utils/sincronizarCarrito.js'

import {
  confirmarPedido,
  obtenerResumenPedido,
} from '../utils/pedidosStorage.js'

vi.mock('../utils/carritoStorage.js', () => ({
  guardarCarrito: vi.fn(),
  reiniciarCarritoDanado: vi.fn(),
}))

vi.mock('../utils/comercioStorage.js', () => ({
  conBloqueoComercio: vi.fn(),
}))

vi.mock('../utils/sincronizarCarrito.js', () => ({
  leerEstadoTienda: vi.fn(),
  reconciliarCarrito: vi.fn(),
}))

vi.mock('../utils/pedidosStorage.js', () => ({
  confirmarPedido: vi.fn(),
  obtenerResumenPedido: vi.fn(),
}))

vi.mock('../components/ProductoCard.jsx', () => ({
  default: function ProductoSimulado({
    producto,
    agregarProducto,
    bloqueado,
  }) {
    return (
      <article>
        <h2>{producto.nombre}</h2>

        <button
          type="button"
          disabled={bloqueado}
          onClick={() =>
            agregarProducto(producto.id, 1)
          }
        >
          Agregar {producto.nombre}
        </button>
      </article>
    )
  },
}))

vi.mock('../components/CarritoPanel.jsx', () => ({
  default: function CarritoSimulado({
    mostrar,
    cerrar,
    items,
    cambiarCantidad,
    eliminarProducto,
    vaciarCarrito,
    irAPagar,
    errorCarrito,
  }) {
    if (!mostrar) return null

    return (
      <div
        role="dialog"
        aria-label="Carrito de prueba"
      >
        {items.map((item) => (
          <div key={item.id}>
            <p>
              {item.nombre} × {item.cantidad}
            </p>

            <button
              type="button"
              onClick={() =>
                cambiarCantidad(item.id, 1)
              }
            >
              Sumar {item.nombre}
            </button>

            <button
              type="button"
              onClick={() =>
                cambiarCantidad(item.id, -1)
              }
            >
              Restar {item.nombre}
            </button>

            <button
              type="button"
              onClick={() =>
                eliminarProducto(item.id)
              }
            >
              Eliminar {item.nombre}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={vaciarCarrito}
        >
          {errorCarrito
            ? 'Reiniciar de prueba'
            : 'Vaciar de prueba'}
        </button>

        <button
          type="button"
          onClick={irAPagar}
        >
          Pagar de prueba
        </button>

        <button type="button" onClick={cerrar}>
          Cerrar carrito de prueba
        </button>
      </div>
    )
  },
}))

vi.mock('../components/ConfirmarPedidoModal.jsx', () => ({
  default: function ConfirmacionSimulada({
    items,
    cerrar,
    confirmar,
  }) {
    return (
      <div
        role="dialog"
        aria-label="Confirmación de prueba"
      >
        <p>
          Artículos recibidos: {items.length}
        </p>

        <button
          type="button"
          onClick={confirmar}
        >
          Confirmar de prueba
        </button>

        <button type="button" onClick={cerrar}>
          Cerrar confirmación de prueba
        </button>
      </div>
    )
  },
}))

const productosPrueba = [
  {
    id: 'polera',
    nombre: 'Polera de prueba',
    precio: 5000,
    stock: 5,
    imagen: 'img/polera.jpg',
  },
  {
    id: 'taza',
    nombre: 'Taza de prueba',
    precio: 3000,
    stock: 8,
    imagen: 'img/taza.jpg',
  },
]

function itemPolera(cantidad = 1) {
  return {
    id: 'polera',
    nombre: 'Polera de prueba',
    precio: 5000,
    cantidad,
  }
}

let estadoSimulado
let usuario

function montarTienda(cambios = {}) {
  estadoSimulado = {
    ...estadoSimulado,
    ...cambios,
  }

  render(<Tienda />)
}

async function pulsar(nombre) {
  await usuario.click(
    screen.getByRole('button', {
      name: nombre,
      exact: true,
    }),
  )
}

async function abrirCarrito() {
  await usuario.click(
    screen.getByRole('button', {
      name: /Ver carrito/,
    }),
  )
}

function carritoAbierto() {
  return screen.getByRole('dialog', {
    name: 'Carrito de prueba',
    exact: true,
  })
}

function confirmacionAbierta() {
  return screen.getByRole('dialog', {
    name: 'Confirmación de prueba',
    exact: true,
  })
}

function comprobarAviso(texto, clase = 'alert-success') {
  expect(
    screen.getByText(texto, {
      exact: true,
    }),
  ).toHaveClass(clase)
}

describe('Tienda', () => {
  beforeEach(() => {
    usuario = userEvent.setup()

    estadoSimulado = {
      productos: productosPrueba,
      items: [],
      conflictos: {},
      cambios: [],
      errorCatalogo: '',
      errorCarrito: '',
    }

    leerEstadoTienda.mockReset()
    leerEstadoTienda.mockImplementation(
      () => estadoSimulado,
    )

    conBloqueoComercio.mockReset()
    conBloqueoComercio.mockImplementation(
      async (accion) => accion(),
    )

    reconciliarCarrito.mockReset()
    reconciliarCarrito.mockImplementation(
      (items) => ({ items }),
    )

    guardarCarrito.mockReset()
    guardarCarrito.mockImplementation((items) => {
      estadoSimulado = {
        ...estadoSimulado,
        items,
      }
    })

    reiniciarCarritoDanado.mockReset()
    reiniciarCarritoDanado.mockImplementation(
      async () => {
        estadoSimulado = {
          ...estadoSimulado,
          items: [],
          errorCarrito: '',
        }
      },
    )

    obtenerResumenPedido.mockReset()
    obtenerResumenPedido.mockImplementation(() => ({
      articulos: estadoSimulado.items,
    }))

    confirmarPedido.mockReset()
    confirmarPedido.mockImplementation(async () => {
      estadoSimulado = {
        ...estadoSimulado,
        items: [],
      }

      return { id: 901 }
    })

    vi.spyOn(window, 'confirm')
      .mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el catálogo y permite abrir y cerrar el carrito', async () => {
    montarTienda({
      items: [itemPolera(2)],
    })

    expect(
      screen.getByRole('heading', {
        name: 'Tienda',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('article'),
    ).toHaveLength(2)

    const verCarrito = screen.getByRole(
      'button',
      { name: /Ver carrito/ },
    )

    expect(
      within(verCarrito).getByText('2', {
        exact: true,
      }),
    ).toBeInTheDocument()

    await abrirCarrito()

    expect(carritoAbierto()).toBeInTheDocument()

    expect(
      screen.getByText('Polera de prueba × 2'),
    ).toBeInTheDocument()

    await pulsar('Cerrar carrito de prueba')

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('muestra el mensaje de catálogo vacío', () => {
    montarTienda({ productos: [] })

    expect(
      screen.getByText(
        'No hay productos disponibles por el momento.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()
  })

  it('muestra el error del catálogo y permite reintentar la lectura', async () => {
    montarTienda({
      errorCatalogo: 'Error de catálogo de prueba.',
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Error de catálogo de prueba.',
    )

    expect(
      screen.queryByRole('article'),
    ).not.toBeInTheDocument()

    estadoSimulado = {
      ...estadoSimulado,
      errorCatalogo: '',
    }

    await pulsar('Reintentar')

    expect(
      screen.getAllByRole('article'),
    ).toHaveLength(2)

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('bloquea las tarjetas si existe un error de carrito', () => {
    montarTienda({
      errorCarrito: 'Carrito inválido de prueba.',
    })

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Carrito inválido de prueba.',
    )

    expect(
      screen.getByRole('button', {
        name: 'Agregar Polera de prueba',
        exact: true,
      }),
    ).toBeDisabled()
  })

  it('agrega un artículo nuevo y acumula cantidades sin perder otros artículos', async () => {
    const taza = {
      id: 'taza',
      nombre: 'Taza de prueba',
      precio: 3000,
      cantidad: 1,
    }

    montarTienda({ items: [taza] })

    await pulsar('Agregar Polera de prueba')

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([
      taza,
      itemPolera(1),
    ])

    await pulsar('Agregar Polera de prueba')

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([
      taza,
      itemPolera(2),
    ])

    expect(
      conBloqueoComercio,
    ).toHaveBeenCalledTimes(2)

    comprobarAviso(
      'Producto agregado al carrito.',
    )

    await abrirCarrito()

    expect(
      screen.getByText('Polera de prueba × 2'),
    ).toBeInTheDocument()
  })

  it('rechaza agregar unidades que superan el stock', async () => {
    montarTienda({
      items: [itemPolera(5)],
    })

    await pulsar('Agregar Polera de prueba')

    expect(
      guardarCarrito,
    ).not.toHaveBeenCalled()

    comprobarAviso(
      'Hay 5 unidades disponibles de "Polera de prueba".',
      'alert-danger',
    )
  })

  it('informa el error si falla el guardado del carrito', async () => {
    guardarCarrito.mockImplementation(() => {
      throw new Error('Error simulado de escritura')
    })

    montarTienda()

    await pulsar('Agregar Polera de prueba')

    comprobarAviso(
      'No se pudo guardar el cambio. Inténtalo nuevamente.',
      'alert-danger',
    )
  })

  it('suma y resta unidades comprobando las cantidades resultantes', async () => {
    montarTienda({
      items: [itemPolera(2)],
    })

    await abrirCarrito()
    await pulsar('Sumar Polera de prueba')

    expect(
      screen.getByText('Polera de prueba × 3'),
    ).toBeInTheDocument()

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([
      itemPolera(3),
    ])

    await pulsar('Restar Polera de prueba')

    expect(
      screen.getByText('Polera de prueba × 2'),
    ).toBeInTheDocument()

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([
      itemPolera(2),
    ])
  })

  it('quita el artículo al restar su última unidad', async () => {
    montarTienda({
      items: [itemPolera(1)],
    })

    await abrirCarrito()
    await pulsar('Restar Polera de prueba')

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([])

    expect(
      screen.queryByText(
        'Polera de prueba × 1',
      ),
    ).not.toBeInTheDocument()
  })

  it('rechaza aumentar una cantidad sin stock disponible', async () => {
    montarTienda({
      items: [itemPolera(5)],
    })

    await abrirCarrito()
    await pulsar('Sumar Polera de prueba')

    comprobarAviso(
      'No hay disponibilidad para aumentar la cantidad.',
      'alert-danger',
    )

    expect(
      guardarCarrito,
    ).not.toHaveBeenCalled()
  })

  it('elimina el artículo solicitado', async () => {
    montarTienda({
      items: [itemPolera()],
    })

    await abrirCarrito()
    await pulsar('Eliminar Polera de prueba')

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([])

    comprobarAviso(
      'Producto eliminado del carrito.',
    )
  })

  it('vacía el carrito y limpia los avisos de cambios del catálogo', async () => {
    montarTienda({
      items: [itemPolera()],
      cambios: ['El precio fue actualizado.'],
    })

    await abrirCarrito()
    await pulsar('Vaciar de prueba')

    expect(
      guardarCarrito,
    ).toHaveBeenLastCalledWith([])

    comprobarAviso('Carrito vaciado.')

    expect(
      screen.queryByText(
        'El precio fue actualizado.',
      ),
    ).not.toBeInTheDocument()
  })

  it('reinicia el carrito dañado después de confirmar', async () => {
    montarTienda({
      errorCarrito: 'Carrito dañado de prueba.',
    })

    await abrirCarrito()
    await pulsar('Reiniciar de prueba')

    expect(
      window.confirm,
    ).toHaveBeenCalledTimes(1)

    expect(
      reiniciarCarritoDanado,
    ).toHaveBeenCalledTimes(1)

    comprobarAviso(
      'Carrito reiniciado. Se conservaron productos y pedidos.',
    )

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('no reinicia el carrito dañado si se rechaza la confirmación', async () => {
    window.confirm.mockReturnValue(false)

    montarTienda({
      errorCarrito: 'Carrito dañado de prueba.',
    })

    await abrirCarrito()
    await pulsar('Reiniciar de prueba')

    expect(
      reiniciarCarritoDanado,
    ).not.toHaveBeenCalled()

    expect(
      guardarCarrito,
    ).not.toHaveBeenCalled()
  })

  it('informa si el carrito ya era válido al intentar reiniciarlo', async () => {
    reiniciarCarritoDanado.mockRejectedValue({
      codigo: 'CARRITO_YA_VALIDO',
    })

    montarTienda({
      errorCarrito: 'Carrito dañado de prueba.',
    })

    await abrirCarrito()
    await pulsar('Reiniciar de prueba')

    comprobarAviso(
      'El carrito cambió y ya es válido. Revisa su contenido antes de volver a vaciarlo.',
      'alert-warning',
    )
  })

  it('prepara el resumen, abre la confirmación y permite cerrarla', async () => {
    montarTienda({
      items: [itemPolera(2)],
    })

    await abrirCarrito()
    await pulsar('Pagar de prueba')

    expect(
      obtenerResumenPedido,
    ).toHaveBeenCalledTimes(1)

    expect(
      confirmacionAbierta(),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Artículos recibidos: 1',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog', {
        name: 'Carrito de prueba',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    await pulsar('Cerrar confirmación de prueba')

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      confirmarPedido,
    ).not.toHaveBeenCalled()
  })

  it.each([
    {
      caso: 'error de catálogo',
      cambios: {
        errorCatalogo: 'Error de catálogo.',
      },
      mensaje:
        'No se pudo comprobar el carrito. Inténtalo nuevamente.',
    },
    {
      caso: 'error de carrito',
      cambios: {
        errorCarrito: 'Error de carrito.',
      },
      mensaje:
        'No se pudo comprobar el carrito. Inténtalo nuevamente.',
    },
    {
      caso: 'conflictos de artículos',
      cambios: {
        conflictos: {
          polera: 'Stock insuficiente.',
        },
      },
      mensaje:
        'Revisa los artículos no disponibles o sus cantidades.',
    },
  ])(
    'no prepara el pedido cuando hay $caso',
    async ({ cambios, mensaje }) => {
      montarTienda({
        items: [itemPolera()],
        ...cambios,
      })

      await abrirCarrito()
      await pulsar('Pagar de prueba')

      expect(
        obtenerResumenPedido,
      ).not.toHaveBeenCalled()

      comprobarAviso(
        mensaje,
        'alert-danger',
      )

      expect(
        carritoAbierto(),
      ).toBeInTheDocument()
    },
  )

  it('muestra el error al intentar pagar un carrito vacío', async () => {
    obtenerResumenPedido.mockImplementation(() => {
      throw { codigo: 'CARRITO_VACIO' }
    })

    montarTienda()

    await abrirCarrito()
    await pulsar('Pagar de prueba')

    comprobarAviso(
      'Agrega productos al carrito antes de continuar.',
      'alert-danger',
    )
  })

  it('confirma el resumen preparado, cierra los paneles y actualiza el carrito', async () => {
    montarTienda({
      items: [itemPolera(2)],
    })

    await abrirCarrito()
    await pulsar('Pagar de prueba')

    const resumen =
      obtenerResumenPedido.mock.results[0].value

    await pulsar('Confirmar de prueba')

    expect(
      confirmarPedido,
    ).toHaveBeenCalledWith(resumen)

    comprobarAviso(
      'Pedido #901 creado. Quedó en estado Pendiente.',
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      estadoSimulado.items,
    ).toEqual([])
  })

  it.each([
    {
      codigo: 'RESUMEN_CAMBIADO',
      mensaje:
        'El carrito, sus precios o la cuenta cambiaron. Revisa los artículos y vuelve a abrir la confirmación.',
      clase: 'alert-warning',
    },
    {
      codigo: 'ERROR_DESCONOCIDO',
      mensaje:
        'No se pudo completar el pedido. Inténtalo nuevamente.',
      clase: 'alert-danger',
    },
  ])(
    'regresa al carrito al fallar la confirmación con $codigo',
    async ({ codigo, mensaje, clase }) => {
      confirmarPedido.mockRejectedValue({
        codigo,
      })

      montarTienda({
        items: [itemPolera()],
      })

      await abrirCarrito()
      await pulsar('Pagar de prueba')
      await pulsar('Confirmar de prueba')

      comprobarAviso(mensaje, clase)

      expect(
        carritoAbierto(),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole('dialog', {
          name: 'Confirmación de prueba',
          exact: true,
        }),
      ).not.toBeInTheDocument()
    },
  )

  it('sincroniza por foco y almacenamiento, ignorando claves ajenas y evitando cambios duplicados', () => {
    montarTienda({
      cambios: ['Cambio inicial.'],
    })

    estadoSimulado = {
      ...estadoSimulado,
      cambios: [
        'Cambio inicial.',
        'Cambio nuevo.',
      ],
    }

    fireEvent(
      window,
      new Event('focus'),
    )

    expect(
      screen.getAllByText('Cambio inicial.'),
    ).toHaveLength(1)

    expect(
      screen.getByText('Cambio nuevo.'),
    ).toBeInTheDocument()

    leerEstadoTienda.mockClear()

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'otraClave',
      }),
    )

    expect(
      leerEstadoTienda,
    ).not.toHaveBeenCalled()

    for (const key of [
      'jugoseoComercio',
      'jugoseoProductos',
      'jugoseoCarrito',
      null,
    ]) {
      leerEstadoTienda.mockClear()

      fireEvent(
        window,
        new StorageEvent('storage', {
          key,
        }),
      )

      expect(
        leerEstadoTienda,
      ).toHaveBeenCalledTimes(1)
    }
  })
})