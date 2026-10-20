import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  actualizarProducto,
  crearProducto,
  eliminarProductoAdministrativo,
  esProductoValido,
  guardarProductos,
  obtenerProductos,
  obtenerProductosAdministrables,
  validarLista,
} from '../utils/productosStorage.js'

import {
  CLAVE_COMERCIO,
  conBloqueoComercio,
} from '../utils/comercioStorage.js'

import {
  CATEGORIAS_VALIDAS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

const productoPrueba = {
  id: 1,
  codigo: 'PROD-001',
  nombre: 'Polera de prueba',
  descripcion: 'Descripción original.',
  categoria: CATEGORIAS_VALIDAS[0],
  precio: 5000,
  stock: 10,
  imagen: 'img/polera.jpg',
}

const segundoProducto = {
  ...productoPrueba,
  id: 2,
  codigo: 'PROD-002',
  nombre: 'Segundo producto de prueba',
}

function datosValidos(cambios = {}) {
  return {
    codigo: '  nuevo-001  ',
    nombre: '  Producto nuevo  ',
    descripcion: '  Descripción nueva.  ',
    categoria: CATEGORIAS_VALIDAS[0],
    precio: '6500',
    stock: '8',
    imagen: '  nuevo.jpg  ',
    ...cambios,
  }
}

function prepararComercio(cambios = {}) {
  const estado = {
    version: 1,
    productos: [
      { ...productoPrueba },
      { ...segundoProducto },
    ],
    carrito: [],
    pedidos: [],
    ultimoIdPedido: 0,
    ...cambios,
  }

  localStorage.setItem(
    CLAVE_COMERCIO,
    JSON.stringify(estado),
  )

  return estado
}

function leerGuardado() {
  return JSON.parse(
    localStorage.getItem(CLAVE_COMERCIO),
  )
}

function guardarSesionAdministrador() {
  sessionStorage.setItem(
    'jugoseoUsuario',
    JSON.stringify({
      correo: 'admin@jugoseo.com',
      rol: 'Administrador',
    }),
  )
}

const descriptorLocks =
  Object.getOwnPropertyDescriptor(
    window.navigator,
    'locks',
  )

describe('productosStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()

    Object.defineProperty(
      window.navigator,
      'locks',
      {
        configurable: true,
        value: {
          request: vi.fn(
            async (...args) => args[2](),
          ),
        },
      },
    )

    prepararComercio()
    guardarSesionAdministrador()
  })

  afterEach(() => {
    vi.restoreAllMocks()

    if (descriptorLocks) {
      Object.defineProperty(
        window.navigator,
        'locks',
        descriptorLocks,
      )
    } else {
      delete window.navigator.locks
    }

    localStorage.clear()
    sessionStorage.clear()
  })

  it('lee y valida el catálogo administrable con una sesión de administrador', () => {
    expect(
      obtenerProductosAdministrables(),
    ).toEqual([
      productoPrueba,
      segundoProducto,
    ])
  })

  it('permite leer el catálogo público sin sesión', () => {
    sessionStorage.clear()

    expect(
      obtenerProductos(),
    ).toEqual([
      productoPrueba,
      segundoProducto,
    ])
  })

  it.each([
    {
      caso: 'sin sesión',
      sesion: null,
    },
    {
      caso: 'con rol Cliente',
      sesion: {
        correo: 'cliente@duocuc.cl',
        rol: 'Cliente',
      },
    },
  ])(
    'rechaza consultar el catálogo administrable $caso',
    ({ sesion }) => {
      sessionStorage.clear()

      if (sesion) {
        sessionStorage.setItem(
          'jugoseoUsuario',
          JSON.stringify(sesion),
        )
      }

      expect(
        () => obtenerProductosAdministrables(),
      ).toThrow('Operación no permitida.')
    },
  )

  it.each([
    {
      caso: 'producto null',
      producto: null,
    },
    {
      caso: 'identificador cero',
      producto: {
        ...productoPrueba,
        id: 0,
      },
    },
    {
      caso: 'nombre vacío',
      producto: {
        ...productoPrueba,
        nombre: ' ',
      },
    },
    {
      caso: 'precio negativo',
      producto: {
        ...productoPrueba,
        precio: -1,
      },
    },
    {
      caso: 'stock decimal',
      producto: {
        ...productoPrueba,
        stock: 1.5,
      },
    },
  ])(
    'detecta un $caso',
    ({ producto }) => {
      expect(
        esProductoValido(producto),
      ).toBe(false)
    },
  )

  it('acepta un catálogo válido y rechaza una lista que no es un arreglo', () => {
    expect(
      esProductoValido(productoPrueba),
    ).toBe(true)

    expect(
      () => validarLista([productoPrueba]),
    ).not.toThrow()

    expect(
      () => validarLista({}),
    ).toThrow(
      'El catálogo contiene datos inválidos.',
    )
  })

  it('rechaza identificadores repetidos', () => {
    expect(
      () => validarLista([
        productoPrueba,
        {
          ...segundoProducto,
          id: productoPrueba.id,
        },
      ]),
    ).toThrow(
      'Hay identificadores repetidos.',
    )
  })

  it.each([
    {
      caso: 'código vacío',
      productos: [
        {
          ...productoPrueba,
          codigo: '',
        },
      ],
    },
    {
      caso: 'códigos duplicados tras normalizar',
      productos: [
        productoPrueba,
        {
          ...segundoProducto,
          codigo: ' prod-001 ',
        },
      ],
    },
  ])(
    'rechaza un catálogo con $caso',
    ({ productos }) => {
      expect(
        () => validarLista(productos),
      ).toThrow(
        'Los códigos del catálogo no son válidos.',
      )
    },
  )

  it('impide guardar productos sin el bloqueo común', () => {
    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    expect(
      () => guardarProductos([productoPrueba]),
    ).toThrow(
      'La escritura de comercio requiere el bloqueo común.',
    )

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('guarda productos dentro del bloqueo conservando carrito y pedidos', async () => {
    const carrito = [{
      id: 1,
      nombre: 'Polera de prueba',
      precio: 5000,
      cantidad: 1,
    }]

    prepararComercio({
      carrito,
      pedidos: [{ id: 7 }],
      ultimoIdPedido: 7,
    })

    await conBloqueoComercio(() => {
      guardarProductos([productoPrueba])
    })

    expect(leerGuardado()).toEqual({
      version: 1,
      productos: [productoPrueba],
      carrito,
      pedidos: [{ id: 7 }],
      ultimoIdPedido: 7,
    })
  })

  it('crea un producto con identificador reservado y datos normalizados', async () => {
    const datos = datosValidos()

    const resultado = await crearProducto(datos)

    const nuevo = resultado.find(
      (producto) =>
        producto.codigo === 'NUEVO-001',
    )

    const mayorInicial = Math.max(
      0,
      ...PRODUCTOS_INICIALES.map(
        (producto) => producto.id,
      ),
    )

    expect(nuevo).toEqual({
      id: Math.max(2, mayorInicial) + 1,
      codigo: 'NUEVO-001',
      nombre: 'Producto nuevo',
      descripcion: 'Descripción nueva.',
      categoria: CATEGORIAS_VALIDAS[0],
      precio: 6500,
      stock: 8,
      imagen: 'img/nuevo.jpg',
    })

    expect(resultado).toHaveLength(3)

    expect(
      leerGuardado().productos,
    ).toEqual(resultado)

    expect(
      localStorage.getItem(
        'jugoseoUltimoIdProducto',
      ),
    ).toBe(String(nuevo.id))
  })

  it('rechaza crear un producto con datos inválidos sin cambiar el catálogo', async () => {
    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      crearProducto(
        datosValidos({ nombre: '' }),
      ),
    ).rejects.toThrow(
      'Los datos ingresados no son válidos.',
    )

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it.each([
    {
      caso: 'secuencia negativa',
      secuencia: '-1',
    },
    {
      caso: 'identificador siguiente fuera del rango seguro',
      secuencia: String(
        Number.MAX_SAFE_INTEGER,
      ),
    },
  ])(
    'rechaza crear con $caso',
    async ({ secuencia }) => {
      localStorage.setItem(
        'jugoseoUltimoIdProducto',
        secuencia,
      )

      const inicial = localStorage.getItem(
        CLAVE_COMERCIO,
      )

      await expect(
        crearProducto(datosValidos()),
      ).rejects.toThrow(
        'No se pudo generar el identificador.',
      )

      expect(
        localStorage.getItem(CLAVE_COMERCIO),
      ).toBe(inicial)
    },
  )

  it('actualiza el producto esperado conservando su identificador y los demás productos', async () => {
    const resultado = await actualizarProducto(
      1,
      datosValidos({
        codigo: 'PROD-001',
        stock: '0',
      }),
      productoPrueba,
    )

    expect(resultado[0]).toEqual({
      id: 1,
      codigo: 'PROD-001',
      nombre: 'Producto nuevo',
      descripcion: 'Descripción nueva.',
      categoria: CATEGORIAS_VALIDAS[0],
      precio: 6500,
      stock: 0,
      imagen: 'img/nuevo.jpg',
    })

    expect(resultado[1]).toEqual(
      segundoProducto,
    )

    expect(
      leerGuardado().productos,
    ).toEqual(resultado)
  })

  it.each([
    {
      caso: 'no se entrega la versión esperada',
      esperado: undefined,
    },
    {
      caso: 'la versión esperada ya no coincide',
      esperado: {
        ...productoPrueba,
        stock: 99,
      },
    },
  ])(
    'rechaza actualizar cuando $caso',
    async ({ esperado }) => {
      const inicial = localStorage.getItem(
        CLAVE_COMERCIO,
      )

      await expect(
        actualizarProducto(
          1,
          datosValidos(),
          esperado,
        ),
      ).rejects.toMatchObject({
        codigo: 'PRODUCTO_CAMBIADO',
      })

      expect(
        localStorage.getItem(CLAVE_COMERCIO),
      ).toBe(inicial)
    },
  )

  it('rechaza actualizar un producto inexistente', async () => {
    await expect(
      actualizarProducto(
        999,
        datosValidos(),
        productoPrueba,
      ),
    ).rejects.toThrow(
      'El producto no está disponible.',
    )
  })

  it('rechaza una actualización con datos inválidos', async () => {
    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      actualizarProducto(
        1,
        datosValidos({ precio: '-1' }),
        productoPrueba,
      ),
    ).rejects.toThrow(
      'Los datos ingresados no son válidos.',
    )

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('elimina un producto disponible que no está en el carrito', async () => {
    const resultado =
      await eliminarProductoAdministrativo(1)

    expect(resultado).toEqual([
      segundoProducto,
    ])

    expect(
      leerGuardado().productos,
    ).toEqual([segundoProducto])
  })

  it('impide eliminar un producto presente en el carrito', async () => {
    prepararComercio({
      carrito: [{
        id: 1,
        nombre: 'Polera de prueba',
        precio: 5000,
        cantidad: 1,
      }],
    })

    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      eliminarProductoAdministrativo(1),
    ).rejects.toMatchObject({
      codigo: 'PRODUCTO_EN_CARRITO',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('rechaza eliminar un producto inexistente', async () => {
    await expect(
      eliminarProductoAdministrativo(999),
    ).rejects.toThrow(
      'El producto no está disponible.',
    )
  })
})