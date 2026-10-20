import {
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

import PanelProductos from '../components/PanelProductos.jsx'

import {
  actualizarProducto,
  crearProducto,
  eliminarProductoAdministrativo,
  obtenerProductosAdministrables,
} from '../utils/productosStorage.js'

import {
  formatearCLP,
} from '../utils/formatoMoneda.js'

const { datosFormulario } = vi.hoisted(() => ({
  datosFormulario: {
    codigo: 'NUEVO-001',
    nombre: 'Producto actualizado de prueba',
    descripcion: 'Descripción de prueba.',
    categoria: 'Categoría de prueba',
    precio: '6500',
    stock: '8',
    imagen: 'producto-prueba.jpg',
  },
}))

vi.mock('../utils/productosStorage.js', () => ({
  actualizarProducto: vi.fn(),
  crearProducto: vi.fn(),
  eliminarProductoAdministrativo: vi.fn(),
  obtenerProductosAdministrables: vi.fn(),
}))

vi.mock(
  '../components/ProductoModal.jsx',
  async () => {
    const { useState } = await import('react')

    return {
      default: function ProductoModalSimulado({
        producto,
        productos,
        cerrar,
        guardar,
      }) {
        const [error, setError] = useState(false)

        return (
          <div
            role="dialog"
            aria-label="Formulario de producto de prueba"
          >
            <p>
              Producto recibido: {producto.id === null
                ? 'Nuevo'
                : producto.nombre}
            </p>

            <p>
              Productos recibidos: {productos.length}
            </p>

            {error && (
              <div role="alert">
                Guardado rechazado en el modal de prueba.
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                const resultado = await guardar(
                  datosFormulario,
                )

                setError(!resultado)
              }}
            >
              Guardar de prueba
            </button>

            <button
              type="button"
              onClick={cerrar}
            >
              Cerrar formulario de prueba
            </button>
          </div>
        )
      },
    }
  },
)

const productosPrueba = [
  {
    id: 'producto-uno',
    codigo: 'PROD-001',
    nombre: 'Polera de prueba',
    categoria: 'Ropa',
    precio: 5000,
    stock: 10,
  },
  {
    id: 'producto-dos',
    codigo: 'PROD-002',
    nombre: 'Taza de prueba',
    categoria: 'Accesorios',
    precio: 3000,
    stock: 3,
  },
  {
    id: 'producto-tres',
    codigo: 'PROD-003',
    nombre: 'Gorro de prueba',
    categoria: 'Ropa',
    precio: 4000,
    stock: 0,
  },
]

function boton(nombre) {
  return screen.getByRole('button', {
    name: nombre,
    exact: true,
  })
}

function filaProducto(nombre) {
  return within(
    screen.getByText(nombre, {
      exact: true,
    }).closest('tr'),
  )
}

function montarPanel() {
  render(<PanelProductos />)
}

async function abrirEdicion(usuario) {
  await usuario.click(
    filaProducto('Polera de prueba')
      .getByRole('button', {
        name: 'Editar',
        exact: true,
      }),
  )
}

describe('PanelProductos', () => {
  beforeEach(() => {
    obtenerProductosAdministrables.mockReset()
    obtenerProductosAdministrables.mockReturnValue(
      productosPrueba,
    )

    crearProducto.mockReset()
    actualizarProducto.mockReset()
    eliminarProductoAdministrativo.mockReset()

    vi.spyOn(window, 'confirm')
      .mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra el catálogo con precios y estados de stock', () => {
    montarPanel()

    expect(
      screen.getByRole('heading', {
        name: 'Gestión de productos',
        exact: true,
      }),
    ).toBeInTheDocument()

    const tabla = within(
      screen.getByRole('table'),
    )

    expect(
      tabla.getAllByRole('row'),
    ).toHaveLength(4)

    const polera = filaProducto(
      'Polera de prueba',
    )

    expect(
      polera.getByText('PROD-001'),
    ).toBeInTheDocument()

    expect(
      polera.getByText(
        formatearCLP(5000),
      ),
    ).toBeInTheDocument()

    expect(
      polera.getByText('10', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      filaProducto('Taza de prueba')
        .getByText('3 · Stock bajo'),
    ).toHaveClass('bg-danger')

    expect(
      filaProducto('Gorro de prueba')
        .getByText('0 · Agotado'),
    ).toHaveClass('bg-danger')
  })

  it('muestra el mensaje de catálogo vacío', () => {
    obtenerProductosAdministrables.mockReturnValue([])

    montarPanel()

    expect(
      screen.getByText(
        'No hay productos disponibles.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('table'),
    ).not.toBeInTheDocument()

    expect(
      boton('Crear producto'),
    ).toBeEnabled()
  })

  it('muestra el error de carga y deshabilita la creación', () => {
    obtenerProductosAdministrables.mockImplementation(
      () => {
        throw new Error('Error simulado de lectura')
      },
    )

    montarPanel()

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'No se pudo cargar esta sección. Inténtalo nuevamente.',
    )

    expect(
      boton('Crear producto'),
    ).toBeDisabled()

    expect(
      screen.queryByRole('table'),
    ).not.toBeInTheDocument()
  })

  it('abre un formulario nuevo con el catálogo y permite cerrarlo', async () => {
    const usuario = userEvent.setup()

    montarPanel()

    await usuario.click(
      boton('Crear producto'),
    )

    expect(
      screen.getByRole('dialog', {
        name: 'Formulario de producto de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Producto recibido: Nuevo',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Productos recibidos: 3',
      ),
    ).toBeInTheDocument()

    await usuario.click(
      boton('Cerrar formulario de prueba'),
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()

    expect(
      crearProducto,
    ).not.toHaveBeenCalled()
  })

  it('crea un producto, actualiza la tabla y cierra el formulario', async () => {
    const usuario = userEvent.setup()

    crearProducto.mockResolvedValue([
      {
        ...datosFormulario,
        id: 'producto-nuevo',
        precio: 6500,
        stock: 8,
      },
    ])

    montarPanel()

    await usuario.click(
      boton('Crear producto'),
    )

    await usuario.click(
      boton('Guardar de prueba'),
    )

    expect(
      crearProducto,
    ).toHaveBeenCalledWith(datosFormulario)

    expect(
      actualizarProducto,
    ).not.toHaveBeenCalled()

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent('Producto creado.')

    expect(
      screen.getByText(
        'Producto actualizado de prueba',
        { exact: true },
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('edita el producto enviando su identificador, datos y versión original', async () => {
    const usuario = userEvent.setup()

    actualizarProducto.mockResolvedValue([
      {
        ...productosPrueba[0],
        ...datosFormulario,
        precio: 6500,
        stock: 8,
      },
    ])

    montarPanel()

    await abrirEdicion(usuario)

    expect(
      screen.getByText(
        'Producto recibido: Polera de prueba',
      ),
    ).toBeInTheDocument()

    await usuario.click(
      boton('Guardar de prueba'),
    )

    expect(
      actualizarProducto,
    ).toHaveBeenCalledWith(
      'producto-uno',
      datosFormulario,
      productosPrueba[0],
    )

    expect(
      crearProducto,
    ).not.toHaveBeenCalled()

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'Producto actualizado.',
    )

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
  })

  it('recarga el catálogo y conserva el formulario si falla el guardado', async () => {
    const usuario = userEvent.setup()

    actualizarProducto.mockRejectedValue(
      new Error('Error simulado de actualización'),
    )

    montarPanel()

    await abrirEdicion(usuario)

    obtenerProductosAdministrables.mockClear()

    await usuario.click(
      boton('Guardar de prueba'),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'Guardado rechazado en el modal de prueba.',
    )

    expect(
      obtenerProductosAdministrables,
    ).toHaveBeenCalled()

    expect(
      screen.getByRole('dialog'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('elimina el producto confirmado y actualiza el catálogo', async () => {
    const usuario = userEvent.setup()

    eliminarProductoAdministrativo.mockResolvedValue(
      productosPrueba.slice(1),
    )

    montarPanel()

    await usuario.click(
      filaProducto('Polera de prueba')
        .getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
    )

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Eliminar "Polera de prueba" del catálogo? ' +
      'Esta acción no se puede deshacer desde la aplicación.',
    )

    expect(
      eliminarProductoAdministrativo,
    ).toHaveBeenCalledWith(
      'producto-uno',
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'Producto eliminado.',
    )

    expect(
      screen.queryByText(
        'Polera de prueba',
        { exact: true },
      ),
    ).not.toBeInTheDocument()
  })

  it('no elimina cuando se rechaza la confirmación', async () => {
    const usuario = userEvent.setup()

    window.confirm.mockReturnValue(false)

    montarPanel()

    await usuario.click(
      filaProducto('Polera de prueba')
        .getByRole('button', {
          name: 'Eliminar',
          exact: true,
        }),
    )

    expect(
      eliminarProductoAdministrativo,
    ).not.toHaveBeenCalled()

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      codigo: 'PRODUCTO_EN_CARRITO',
      mensaje:
        'Quita primero este producto del carrito guardado antes de eliminarlo del catálogo.',
    },
    {
      codigo: 'BLOQUEO_NO_DISPONIBLE',
      mensaje:
        'No se puede coordinar el almacenamiento. Utiliza localhost o HTTPS en un navegador compatible.',
    },
    {
      codigo: 'ERROR_DESCONOCIDO',
      mensaje:
        'No se pudo eliminar el producto. Inténtalo nuevamente.',
    },
  ])(
    'muestra el mensaje de eliminación fallida para $codigo',
    async ({ codigo, mensaje }) => {
      const usuario = userEvent.setup()

      eliminarProductoAdministrativo.mockRejectedValue({
        codigo,
      })

      montarPanel()

      await usuario.click(
        filaProducto('Polera de prueba')
          .getByRole('button', {
            name: 'Eliminar',
            exact: true,
          }),
      )

      expect(
        await screen.findByRole('status'),
      ).toHaveTextContent(mensaje)

      expect(
        screen.getByRole('status'),
      ).toHaveClass('alert-danger')

      expect(
        screen.getByText(
          'Polera de prueba',
          { exact: true },
        ),
      ).toBeInTheDocument()
    },
  )
})