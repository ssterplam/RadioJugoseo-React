import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  CLAVE_COMERCIO,
  conBloqueoComercio,
  guardarComercio,
  leerComercio,
} from '../utils/comercioStorage.js'

import {
  guardarCarrito,
  obtenerCarrito,
  reiniciarCarritoDanado,
  validarCarrito,
} from '../utils/carritoStorage.js'

import {
  leerEstadoTienda,
  reconciliarCarrito,
} from '../utils/sincronizarCarrito.js'

import {
  CATEGORIAS_VALIDAS,
  CLAVE_PRODUCTOS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

import {
  formatearCLP,
} from '../utils/formatoMoneda.js'

const productoPrueba = {
  id: 1,
  codigo: 'PROD-001',
  nombre: 'Polera de prueba',
  descripcion: 'Producto de prueba.',
  categoria: CATEGORIAS_VALIDAS[0],
  imagen: 'img/polera.jpg',
  precio: 5000,
  stock: 5,
}

function itemPrueba(cambios = {}) {
  return {
    id: 1,
    nombre: 'Polera de prueba',
    precio: 5000,
    cantidad: 2,
    ...cambios,
  }
}

function estadoBase(cambios = {}) {
  return {
    version: 1,
    productos: [{ ...productoPrueba }],
    carrito: [],
    pedidos: [],
    ultimoIdPedido: 0,
    ...cambios,
  }
}

function prepararComercio(cambios = {}) {
  const estado = estadoBase(cambios)

  localStorage.setItem(
    CLAVE_COMERCIO,
    JSON.stringify(estado),
  )

  return estado
}

function contenidoGuardado() {
  return JSON.parse(
    localStorage.getItem(CLAVE_COMERCIO),
  )
}

const descriptorLocks =
  Object.getOwnPropertyDescriptor(
    window.navigator,
    'locks',
  )

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

describe('comercioStorage', () => {
  it('devuelve el estado inicial sin escribir automáticamente en el almacenamiento', () => {
    const estado = leerComercio()

    expect(estado).toEqual({
      version: 1,
      productos: PRODUCTOS_INICIALES,
      carrito: [],
      pedidos: [],
      ultimoIdPedido: 0,
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBeNull()

    expect(estado.productos).not.toBe(
      PRODUCTOS_INICIALES,
    )

    expect(estado.productos[0]).not.toBe(
      PRODUCTOS_INICIALES[0],
    )
  })

  it('recupera los datos de las claves anteriores cuando no existe el estado unificado', () => {
    const productos = [{ ...productoPrueba }]
    const carrito = [itemPrueba()]
    const pedidos = [{ id: 3 }]

    localStorage.setItem(
      CLAVE_PRODUCTOS,
      JSON.stringify(productos),
    )

    localStorage.setItem(
      'jugoseoCarrito',
      JSON.stringify(carrito),
    )

    localStorage.setItem(
      'jugoseoPedidos',
      JSON.stringify(pedidos),
    )

    localStorage.setItem(
      'jugoseoUltimoIdPedido',
      '3',
    )

    expect(leerComercio()).toEqual({
      version: 1,
      productos,
      carrito,
      pedidos,
      ultimoIdPedido: 3,
    })
  })

  it('lee el estado unificado y lo prioriza sobre las claves anteriores', () => {
    const estado = prepararComercio({
      carrito: [itemPrueba()],
    })

    localStorage.setItem(
      CLAVE_PRODUCTOS,
      'json anterior inválido',
    )

    expect(leerComercio()).toEqual(estado)
  })

  it.each([
    {
      caso: 'versión incorrecta',
      cambios: { version: 2 },
    },
    {
      caso: 'catálogo que no es un arreglo',
      cambios: { productos: {} },
    },
    {
      caso: 'carrito que no es un arreglo',
      cambios: { carrito: null },
    },
    {
      caso: 'pedidos que no son un arreglo',
      cambios: { pedidos: {} },
    },
    {
      caso: 'secuencia de pedidos negativa',
      cambios: { ultimoIdPedido: -1 },
    },
  ])(
    'rechaza una estructura con $caso',
    ({ cambios }) => {
      prepararComercio(cambios)

      const inicial =
        localStorage.getItem(CLAVE_COMERCIO)

      expect(
        () => leerComercio(),
      ).toThrow(
        'No se pudo leer el almacenamiento de comercio.',
      )

      expect(
        localStorage.getItem(CLAVE_COMERCIO),
      ).toBe(inicial)
    },
  )

  it('solo tolera el JSON inválido del carrito anterior cuando se solicita expresamente', () => {
    localStorage.setItem(
      'jugoseoCarrito',
      '{json inválido',
    )

    expect(
      () => leerComercio(),
    ).toThrow()

    expect(
      leerComercio({
        permitirCarritoInvalido: true,
      }).carrito,
    ).toBeNull()

    expect(
      localStorage.getItem('jugoseoCarrito'),
    ).toBe('{json inválido')
  })

  it('impide guardar comercio sin el bloqueo común', () => {
    expect(
      () => guardarComercio(estadoBase()),
    ).toThrow(
      'La escritura de comercio requiere el bloqueo común.',
    )

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBeNull()
  })

  it('guarda dentro del bloqueo y devuelve el resultado de la tarea', async () => {
    const estado = estadoBase()

    const resultado = await conBloqueoComercio(
      () => {
        guardarComercio(estado)
        return 'operación terminada'
      },
    )

    expect(resultado).toBe(
      'operación terminada',
    )

    expect(contenidoGuardado()).toEqual(
      estado,
    )

    expect(
      navigator.locks.request,
    ).toHaveBeenCalledWith(
      'jugoseo-comercio-escritura',
      { mode: 'exclusive' },
      expect.any(Function),
    )

    expect(
      () => guardarComercio(estado),
    ).toThrow(
      'La escritura de comercio requiere el bloqueo común.',
    )
  })

  it('rechaza una tarea interna que devuelve una promesa', async () => {
    await expect(
      conBloqueoComercio(
        () => Promise.resolve('resultado'),
      ),
    ).rejects.toThrow(
      'La operación interna de comercio debe ser síncrona.',
    )

    expect(
      () => guardarComercio(estadoBase()),
    ).toThrow(
      'La escritura de comercio requiere el bloqueo común.',
    )
  })

  it('restablece el indicador de bloqueo aunque la tarea falle', async () => {
    await expect(
      conBloqueoComercio(() => {
        throw new Error('Fallo de prueba')
      }),
    ).rejects.toThrow('Fallo de prueba')

    expect(
      () => guardarComercio(estadoBase()),
    ).toThrow(
      'La escritura de comercio requiere el bloqueo común.',
    )
  })

  it('rechaza la operación si la API de bloqueos no está disponible', async () => {
    Object.defineProperty(
      window.navigator,
      'locks',
      {
        configurable: true,
        value: undefined,
      },
    )

    const tarea = vi.fn()

    await expect(
      conBloqueoComercio(tarea),
    ).rejects.toMatchObject({
      codigo: 'BLOQUEO_NO_DISPONIBLE',
    })

    expect(tarea).not.toHaveBeenCalled()
  })
})

describe('carritoStorage', () => {
  it('acepta un carrito vacío y artículos válidos', () => {
    expect(
      () => validarCarrito([]),
    ).not.toThrow()

    expect(
      () => validarCarrito([itemPrueba()]),
    ).not.toThrow()
  })

  it.each([
    {
      caso: 'lista null',
      items: null,
    },
    {
      caso: 'artículo null',
      items: [null],
    },
    {
      caso: 'cantidad cero',
      items: [itemPrueba({ cantidad: 0 })],
    },
    {
      caso: 'identificador de tipo texto',
      items: [itemPrueba({ id: '1' })],
    },
  ])(
    'rechaza un carrito con $caso',
    ({ items }) => {
      expect(
        () => validarCarrito(items),
      ).toThrow(
        'El carrito contiene datos inválidos.',
      )
    },
  )

  it('rechaza identificadores repetidos', () => {
    expect(
      () => validarCarrito([
        itemPrueba(),
        itemPrueba({ cantidad: 1 }),
      ]),
    ).toThrow(
      'El carrito contiene productos repetidos.',
    )
  })

  it('obtiene y valida el carrito del estado unificado', () => {
    prepararComercio({
      carrito: [itemPrueba()],
    })

    expect(obtenerCarrito()).toEqual([
      itemPrueba(),
    ])
  })

  it('guarda el carrito dentro del bloqueo sin reemplazar productos ni pedidos', async () => {
    const inicial = prepararComercio({
      pedidos: [{ id: 7 }],
      ultimoIdPedido: 7,
    })

    await conBloqueoComercio(() => {
      guardarCarrito([itemPrueba()])
    })

    expect(contenidoGuardado()).toEqual({
      ...inicial,
      carrito: [itemPrueba()],
    })
  })

  it('reinicia únicamente el carrito dañado y conserva otras claves', async () => {
    const inicial = prepararComercio({
      carrito: null,
      pedidos: [{ id: 7 }],
      ultimoIdPedido: 7,
    })

    localStorage.setItem(
      'jugoseoRadioescuchas',
      'datos de usuarios a conservar',
    )

    await reiniciarCarritoDanado()

    expect(contenidoGuardado()).toEqual({
      ...inicial,
      carrito: [],
    })

    expect(
      localStorage.getItem(
        'jugoseoRadioescuchas',
      ),
    ).toBe(
      'datos de usuarios a conservar',
    )
  })

  it('no reinicia un carrito que ya es válido', async () => {
    prepararComercio({
      carrito: [itemPrueba()],
    })

    const inicial =
      localStorage.getItem(CLAVE_COMERCIO)

    await expect(
      reiniciarCarritoDanado(),
    ).rejects.toMatchObject({
      codigo: 'CARRITO_YA_VALIDO',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })
})

describe('sincronizarCarrito', () => {
  it('conserva un carrito que coincide con el catálogo sin solicitar guardado', () => {
    const item = itemPrueba()

    const resultado = reconciliarCarrito(
      [item],
      [productoPrueba],
    )

    expect(resultado).toEqual({
      items: [item],
      conflictos: {},
      cambios: [],
      requiereGuardado: false,
    })

    expect(
      resultado.items[0],
    ).not.toBe(item)
  })

  it('actualiza nombre y precio, informa los cambios y conserva la cantidad', () => {
    const original = itemPrueba({
      nombre: 'Nombre anterior',
      precio: 4000,
    })

    const resultado = reconciliarCarrito(
      [original],
      [productoPrueba],
    )

    expect(resultado.items).toEqual([
      itemPrueba(),
    ])

    expect(resultado.requiereGuardado).toBe(
      true,
    )

    expect(resultado.cambios).toEqual([
      'El nombre "Nombre anterior" se actualizó a "Polera de prueba".',
      'El precio de "Polera de prueba" cambió de ' +
        `${formatearCLP(4000)} a ${formatearCLP(5000)}.`,
    ])

    expect(original).toEqual(
      itemPrueba({
        nombre: 'Nombre anterior',
        precio: 4000,
      }),
    )
  })

  it('marca un producto no disponible sin eliminarlo automáticamente', () => {
    const resultado = reconciliarCarrito(
      [itemPrueba()],
      [],
    )

    expect(resultado.items).toEqual([
      itemPrueba(),
    ])

    expect(resultado.conflictos[1]).toBe(
      'Producto no disponible. Quita este artículo para continuar.',
    )
  })

  it('marca un producto agotado sin alterar la cantidad', () => {
    const resultado = reconciliarCarrito(
      [itemPrueba()],
      [{
        ...productoPrueba,
        stock: 0,
      }],
    )

    expect(resultado.conflictos[1]).toBe(
      'Producto agotado. Quita este artículo para continuar.',
    )

    expect(
      resultado.items[0].cantidad,
    ).toBe(2)
  })

  it('marca cantidades superiores al stock sin reducirlas automáticamente', () => {
    const resultado = reconciliarCarrito(
      [itemPrueba({ cantidad: 7 })],
      [productoPrueba],
    )

    expect(resultado.conflictos[1]).toBe(
      'Hay 5 unidades disponibles. Reduce la cantidad para continuar.',
    )

    expect(
      resultado.items[0].cantidad,
    ).toBe(7)
  })

  it('lee y reconcilia el estado de tienda sin escribir los cambios', () => {
    prepararComercio({
      carrito: [
        itemPrueba({
          nombre: 'Nombre anterior',
        }),
      ],
    })

    const inicial =
      localStorage.getItem(CLAVE_COMERCIO)

    const resultado = leerEstadoTienda()

    expect(resultado.errorCatalogo).toBe('')
    expect(resultado.errorCarrito).toBe('')

    expect(resultado.items).toEqual([
      itemPrueba(),
    ])

    expect(resultado.requiereGuardado).toBe(
      true,
    )

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('informa un catálogo inválido sin reemplazar los datos guardados', () => {
    prepararComercio({
      productos: [{ id: 1 }],
    })

    const inicial =
      localStorage.getItem(CLAVE_COMERCIO)

    const resultado = leerEstadoTienda()

    expect(
      resultado.errorCatalogo,
    ).toContain(
      'No se pudo consultar el catálogo',
    )

    expect(resultado.productos).toEqual([])
    expect(resultado.items).toEqual([])

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('conserva el catálogo cuando el carrito contiene datos inválidos', () => {
    prepararComercio({
      carrito: null,
    })

    const resultado = leerEstadoTienda()

    expect(resultado.errorCatalogo).toBe('')

    expect(
      resultado.errorCarrito,
    ).toContain(
      'El carrito guardado contiene datos inválidos.',
    )

    expect(resultado.productos).toEqual([
      productoPrueba,
    ])

    expect(resultado.items).toEqual([])
  })
})