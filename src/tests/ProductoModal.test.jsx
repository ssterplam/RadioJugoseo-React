import {
  act,
  fireEvent,
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

import ProductoModal from '../components/ProductoModal.jsx'

import {
  CATEGORIAS_VALIDAS,
} from '../data/productos.js'

const productoPrueba = {
  id: 'producto-prueba',
  codigo: 'PROD-001',
  nombre: 'Producto de prueba',
  descripcion: 'Descripción del producto.',
  categoria: CATEGORIAS_VALIDAS[0],
  precio: 5000,
  stock: 10,
  imagen: 'img/producto-prueba.jpg',
}

function montarModal(propiedades = {}) {
  const props = {
    producto: productoPrueba,
    productos: [productoPrueba],
    cerrar: vi.fn(),
    guardar: vi.fn().mockResolvedValue(true),
    ...propiedades,
  }

  render(<ProductoModal {...props} />)

  return props
}

function campo(nombre) {
  return screen.getByLabelText(nombre, {
    exact: true,
  })
}

function cambiar(nombre, valor) {
  fireEvent.change(campo(nombre), {
    target: { value: valor },
  })
}

async function guardarCambios(usuario) {
  await usuario.click(
    screen.getByRole('button', {
      name: 'Guardar cambios',
      exact: true,
    }),
  )
}

describe('ProductoModal', () => {
  it('carga el producto existente y elimina el prefijo img/ del archivo de imagen', () => {
    montarModal()

    expect(
      screen.getByRole('dialog', {
        name: 'Editar producto',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(campo('Código')).toHaveValue(
      'PROD-001',
    )

    expect(campo('Nombre')).toHaveValue(
      'Producto de prueba',
    )

    expect(
      campo('Descripción (opcional)'),
    ).toHaveValue(
      'Descripción del producto.',
    )

    expect(campo('Categoría')).toHaveValue(
      CATEGORIAS_VALIDAS[0],
    )

    expect(
      campo('Precio en pesos chilenos'),
    ).toHaveValue(5000)

    expect(campo('Stock')).toHaveValue(10)

    expect(
      campo('Archivo de imagen'),
    ).toHaveValue('producto-prueba.jpg')

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('muestra el modo de creación con valores inicialmente vacíos', () => {
    montarModal({
      producto: { id: null },
      productos: [],
    })

    expect(
      screen.getByRole('dialog', {
        name: 'Crear producto',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(campo('Código')).toHaveValue('')
    expect(campo('Nombre')).toHaveValue('')

    expect(
      campo('Descripción (opcional)'),
    ).toHaveValue('')

    expect(campo('Categoría')).toHaveValue('')

    expect(
      campo('Precio en pesos chilenos'),
    ).toHaveValue(null)

    expect(campo('Stock')).toHaveValue(null)

    expect(
      screen.getByRole('button', {
        name: 'Crear producto',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('rechaza un producto vacío sin solicitar el guardado', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      producto: { id: null },
      productos: [],
    })

    await usuario.click(
      screen.getByRole('button', {
        name: 'Crear producto',
        exact: true,
      }),
    )

    expect(guardar).not.toHaveBeenCalled()

    for (const nombre of [
      'Código',
      'Nombre',
      'Categoría',
      'Precio en pesos chilenos',
      'Stock',
      'Archivo de imagen',
    ]) {
      expect(
        campo(nombre),
      ).toHaveClass('is-invalid')

      expect(
        campo(nombre),
      ).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    }

    expect(
      campo('Descripción (opcional)'),
    ).not.toHaveClass('is-invalid')
  })

  it('envía los datos editados y permite conservar el código del mismo producto', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal()

    cambiar('Nombre', 'Nombre actualizado')
    cambiar('Precio en pesos chilenos', '6500')
    cambiar('Stock', '0')

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith({
      codigo: 'PROD-001',
      nombre: 'Nombre actualizado',
      descripcion: 'Descripción del producto.',
      categoria: CATEGORIAS_VALIDAS[0],
      precio: '6500',
      stock: '0',
      imagen: 'producto-prueba.jpg',
    })

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'Guardar cambios',
          exact: true,
        }),
      ).toBeEnabled()
    })

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('rechaza un código duplicado y limpia el error al corregirlo', async () => {
    const usuario = userEvent.setup()

    const { guardar } = montarModal({
      productos: [
        productoPrueba,
        {
          ...productoPrueba,
          id: 'otro-producto',
          codigo: 'OTRO-001',
        },
      ],
    })

    cambiar('Código', 'OTRO-001')

    await guardarCambios(usuario)

    expect(guardar).not.toHaveBeenCalled()

    expect(
      screen.getByText(
        'Ya existe un producto con ese código.',
      ),
    ).toBeInTheDocument()

    expect(
      campo('Código'),
    ).toHaveClass('is-invalid')

    cambiar('Código', 'NUEVO-001')

    expect(
      campo('Código'),
    ).not.toHaveClass('is-invalid')

    await guardarCambios(usuario)

    expect(guardar).toHaveBeenCalledTimes(1)

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'NUEVO-001',
      }),
    )
  })

  it('muestra el rechazo del guardado y elimina el aviso al editar', async () => {
    const usuario = userEvent.setup()

    montarModal({
      guardar: vi.fn().mockResolvedValue(false),
    })

    await guardarCambios(usuario)

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'No se pudo guardar el producto. Revisa los datos.',
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Si cambió el catálogo, cierra este formulario y vuelve a abrirlo para cargar la versión actual.',
    )

    cambiar('Nombre', 'Otro nombre válido')

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument()
  })

  it('muestra un error genérico y recupera los controles si guardar lanza una excepción', async () => {
    const usuario = userEvent.setup()

    montarModal({
      guardar: vi.fn().mockRejectedValue(
        new Error('Error simulado de guardado'),
      ),
    })

    await guardarCambios(usuario)

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'No se pudo guardar el producto. Inténtalo nuevamente.',
    )

    expect(
      screen.getByRole('button', {
        name: 'Guardar cambios',
        exact: true,
      }),
    ).toBeEnabled()

    expect(campo('Nombre')).toBeEnabled()
  })

  it('bloquea campos, cierre y otro envío mientras el guardado está pendiente', async () => {
    const usuario = userEvent.setup()

    let resolverGuardado

    const guardar = vi.fn(
      () => new Promise((resolve) => {
        resolverGuardado = resolve
      }),
    )

    const { cerrar } = montarModal({
      guardar,
    })

    await guardarCambios(usuario)

    const botonGuardando = screen.getByRole(
      'button',
      {
        name: 'Guardando…',
        exact: true,
      },
    )

    expect(botonGuardando).toBeDisabled()

    expect(botonGuardando).toHaveAttribute(
      'aria-busy',
      'true',
    )

    for (const nombre of [
      'Código',
      'Nombre',
      'Descripción (opcional)',
      'Precio en pesos chilenos',
      'Stock',
      'Archivo de imagen',
      'Categoría',
    ]) {
      expect(campo(nombre)).toBeDisabled()
    }

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

    await usuario.click(botonGuardando)
    await usuario.keyboard('{Escape}')

    expect(guardar).toHaveBeenCalledTimes(1)
    expect(cerrar).not.toHaveBeenCalled()

    await act(async () => {
      resolverGuardado(true)
    })

    expect(
      screen.getByRole('button', {
        name: 'Guardar cambios',
        exact: true,
      }),
    ).toBeEnabled()

    expect(campo('Nombre')).toBeEnabled()

    expect(
      screen.getByRole('button', {
        name: 'Cancelar',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('solicita el cierre mediante Cancelar y Cerrar sin guardar', async () => {
    const usuario = userEvent.setup()

    const {
      cerrar,
      guardar,
    } = montarModal()

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
    expect(guardar).not.toHaveBeenCalled()
  })
})