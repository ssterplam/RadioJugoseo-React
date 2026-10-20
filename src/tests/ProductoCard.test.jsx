import {
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

import ProductoCard from '../components/ProductoCard.jsx'

const productoBase = {
  id: 99,
  codigo: 'PRU099',
  nombre: 'Producto de prueba',
  descripcion: 'Producto ficticio para las pruebas.',
  categoria: 'Poleras',
  precio: 1000,
  stock: 8,
  imagen: 'img/polera1.jpg',
}

describe('ProductoCard', () => {
  it('muestra el nombre, la categoría, la imagen y el stock', () => {
    render(
      <ProductoCard
        producto={productoBase}
        agregarProducto={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Producto de prueba',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Poleras'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('img', {
        name: 'Producto de prueba',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(/Stock:\s*8/),
    ).toBeInTheDocument()
  })

  it('deshabilita la compra cuando el producto está agotado', () => {
    render(
      <ProductoCard
        producto={{
          ...productoBase,
          stock: 0,
        }}
        agregarProducto={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Agotado'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Sin stock',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('spinbutton', {
        name: 'Cantidad de Producto de prueba',
      }),
    ).toBeDisabled()
  })

  it('deshabilita los controles cuando recibe bloqueado', () => {
    render(
      <ProductoCard
        producto={productoBase}
        agregarProducto={vi.fn()}
        bloqueado
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Agregar',
      }),
    ).toBeDisabled()

    expect(
      screen.getByRole('spinbutton', {
        name: 'Cantidad de Producto de prueba',
      }),
    ).toBeDisabled()
  })

  it('envía la cantidad seleccionada y la reinicia al agregar correctamente', async () => {
    const usuario = userEvent.setup()

    const agregarProducto = vi.fn().mockResolvedValue(true)

    render(
      <ProductoCard
        producto={productoBase}
        agregarProducto={agregarProducto}
      />,
    )

    const cantidad = screen.getByRole('spinbutton', {
      name: 'Cantidad de Producto de prueba',
    })

    await usuario.clear(cantidad)
    await usuario.type(cantidad, '2')

    await usuario.click(
      screen.getByRole('button', {
        name: 'Agregar',
      }),
    )

    await waitFor(() => {
      expect(agregarProducto).toHaveBeenCalledExactlyOnceWith(
        99,
        2,
      )

      expect(cantidad).toHaveValue(1)
    })
  })
})

/* Se está probando:
* Renderizado: El componente utiliza los datos que recibe. 
* Producto agotado: Muestra el aviso y deshabilita los controles.
* Propiedad bloqueado: Respeta el bloqueo recibido desde Tienda.
* Evento de compra: Envía identificador y cantidad, espera el resultado y reinicia el campo.*/