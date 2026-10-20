import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  cancelarPedido,
  cambiarEstadoPedido,
  confirmarPedido,
  obtenerPedidos,
  obtenerPedidosAdministrables,
  obtenerPedidosPropios,
  obtenerResumenPedido,
  obtenerSiguienteEstado,
} from '../utils/pedidosStorage.js'

import {
  CLAVE_COMERCIO,
} from '../utils/comercioStorage.js'

import {
  CATEGORIAS_VALIDAS,
} from '../data/productos.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const cliente = usuariosDemo.find(
  (usuario) => usuario.rol === 'Cliente',
)

const administrador = usuariosDemo.find(
  (usuario) => usuario.rol === 'Administrador',
)

const fecha = '2026-01-01T10:00:00.000Z'

function productoPrueba(cambios = {}) {
  return {
    id: 1,
    codigo: 'PROD-001',
    nombre: 'Polera de prueba',
    descripcion: 'Producto para pruebas.',
    categoria: CATEGORIAS_VALIDAS[0],
    imagen: 'img/polera.jpg',
    precio: 5000,
    stock: 10,
    ...cambios,
  }
}

function segundoProducto(cambios = {}) {
  return productoPrueba({
    id: 2,
    codigo: 'PROD-002',
    nombre: 'Segundo producto',
    precio: 3000,
    stock: 20,
    ...cambios,
  })
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

function articuloPrueba(cambios = {}) {
  return {
    ...itemPrueba(),
    subtotal: 10000,
    ...cambios,
  }
}

function pedidoPrueba(cambios = {}) {
  return {
    id: 1,
    correoCliente: cliente.correo,
    estado: 'Pendiente',
    fechaCreacion: fecha,
    fechaActualizacion: fecha,
    total: 10000,
    articulos: [articuloPrueba()],
    motivoCancelacion: null,
    ...cambios,
  }
}

function prepararComercio(cambios = {}) {
  const estado = {
    version: 1,
    productos: [
      productoPrueba(),
      segundoProducto(),
    ],
    carrito: [itemPrueba()],
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

function guardarSesion(cuenta = cliente) {
  sessionStorage.setItem(
    'jugoseoUsuario',
    JSON.stringify({
      correo: cuenta.correo,
      rol: cuenta.rol,
    }),
  )
}

function obtenerCodigoError(accion) {
  try {
    accion()
  } catch (error) {
    return error.codigo
  }

  throw new Error(
    'La operación debía ser rechazada.',
  )
}

const descriptorLocks =
  Object.getOwnPropertyDescriptor(
    window.navigator,
    'locks',
  )

describe('pedidosStorage', () => {
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
    guardarSesion()
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

  it.each([
    ['Pendiente', 'En preparación'],
    ['En preparación', 'Enviado'],
    ['Enviado', 'Entregado'],
    ['Entregado', null],
    ['Cancelado', null],
    ['Desconocido', null],
  ])(
    'devuelve el siguiente estado de %s',
    (actual, siguiente) => {
      expect(
        obtenerSiguienteEstado(actual),
      ).toBe(siguiente)
    },
  )

  it('devuelve una lista vacía cuando no hay pedidos', () => {
    expect(obtenerPedidos()).toEqual([])
  })

  it('devuelve pedidos con estructura válida', () => {
    const pedido = pedidoPrueba()

    prepararComercio({
      pedidos: [pedido],
      ultimoIdPedido: 1,
    })

    expect(obtenerPedidos()).toEqual([
      pedido,
    ])
  })

  it.each([
    {
      caso: 'pedido null',
      pedido: null,
    },
    {
      caso: 'fecha inválida',
      pedido: pedidoPrueba({
        fechaCreacion: 'fecha-inválida',
      }),
    },
    {
      caso: 'subtotal incorrecto',
      pedido: pedidoPrueba({
        articulos: [
          articuloPrueba({
            subtotal: 1,
          }),
        ],
      }),
    },
    {
      caso: 'estado desconocido',
      pedido: pedidoPrueba({
        estado: 'Desconocido',
      }),
    },
  ])(
    'rechaza un $caso sin reemplazar el almacenamiento',
    ({ pedido }) => {
      prepararComercio({
        pedidos: [pedido],
      })

      const inicial = localStorage.getItem(
        CLAVE_COMERCIO,
      )

      expect(
        () => obtenerPedidos(),
      ).toThrow(
        'Hay un pedido con datos inválidos.',
      )

      expect(
        localStorage.getItem(CLAVE_COMERCIO),
      ).toBe(inicial)
    },
  )

  it('rechaza un total que no coincide con los artículos', () => {
    prepararComercio({
      pedidos: [
        pedidoPrueba({
          total: 9999,
        }),
      ],
    })

    expect(
      () => obtenerPedidos(),
    ).toThrow(
      'El contenido del pedido no es válido.',
    )
  })

  it('rechaza artículos repetidos dentro del pedido', () => {
    prepararComercio({
      pedidos: [
        pedidoPrueba({
          articulos: [
            articuloPrueba(),
            articuloPrueba(),
          ],
          total: 20000,
        }),
      ],
    })

    expect(
      () => obtenerPedidos(),
    ).toThrow(
      'El contenido del pedido no es válido.',
    )
  })

  it('rechaza identificadores de pedidos repetidos', () => {
    prepararComercio({
      pedidos: [
        pedidoPrueba(),
        pedidoPrueba(),
      ],
    })

    expect(
      () => obtenerPedidos(),
    ).toThrow(
      'Hay identificadores de pedidos repetidos.',
    )
  })

  it('filtra los pedidos de la cuenta actual', () => {
    const propio = pedidoPrueba()

    prepararComercio({
      pedidos: [
        propio,
        pedidoPrueba({
          id: 2,
          correoCliente: 'otra@duocuc.cl',
        }),
      ],
      ultimoIdPedido: 2,
    })

    expect(
      obtenerPedidosPropios(),
    ).toEqual([propio])
  })

  it('exige sesión para consultar pedidos propios y preparar el resumen', () => {
    sessionStorage.clear()

    expect(
      obtenerCodigoError(
        () => obtenerPedidosPropios(),
      ),
    ).toBe('SESION_REQUERIDA')

    expect(
      obtenerCodigoError(
        () => obtenerResumenPedido(),
      ),
    ).toBe('SESION_REQUERIDA')
  })

  it('permite consultar todos los pedidos al administrador', () => {
    guardarSesion(administrador)

    const pedido = pedidoPrueba()

    prepararComercio({
      pedidos: [pedido],
      ultimoIdPedido: 1,
    })

    expect(
      obtenerPedidosAdministrables(),
    ).toEqual([pedido])
  })

  it('rechaza la consulta administrativa desde una cuenta cliente', () => {
    expect(
      obtenerCodigoError(
        () => obtenerPedidosAdministrables(),
      ),
    ).toBe('OPERACION_NO_PERMITIDA')
  })

  it('prepara el resumen con precios del catálogo y artículos ordenados', () => {
    prepararComercio({
      carrito: [
        itemPrueba({
          id: 2,
          nombre: 'Nombre anterior',
          precio: 1,
          cantidad: 1,
        }),
        itemPrueba(),
      ],
    })

    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    expect(
      obtenerResumenPedido(),
    ).toEqual({
      correoCliente: cliente.correo,
      cuentaId: null,
      versionCuenta: 0,
      articulos: [
        articuloPrueba(),
        {
          id: 2,
          nombre: 'Segundo producto',
          precio: 3000,
          cantidad: 1,
          subtotal: 3000,
        },
      ],
      total: 13000,
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it.each([
    {
      caso: 'carrito vacío',
      cambios: {
        carrito: [],
      },
      codigo: 'CARRITO_VACIO',
    },
    {
      caso: 'producto inexistente',
      cambios: {
        carrito: [
          itemPrueba({ id: 999 }),
        ],
      },
      codigo: 'PRODUCTO_NO_DISPONIBLE',
    },
    {
      caso: 'cantidad superior al stock',
      cambios: {
        carrito: [
          itemPrueba({ cantidad: 11 }),
        ],
      },
      codigo: 'STOCK_INSUFICIENTE',
    },
  ])(
    'rechaza el resumen con $caso',
    ({ cambios, codigo }) => {
      prepararComercio(cambios)

      expect(
        obtenerCodigoError(
          () => obtenerResumenPedido(),
        ),
      ).toBe(codigo)
    },
  )

  it('rechaza un subtotal fuera del rango de enteros seguros', () => {
    prepararComercio({
      productos: [
        productoPrueba({
          precio: Number.MAX_SAFE_INTEGER,
        }),
      ],
    })

    expect(
      obtenerCodigoError(
        () => obtenerResumenPedido(),
      ),
    ).toBe('DATOS_INVALIDOS')
  })

  it('rechaza un total fuera del rango seguro aunque cada subtotal sea válido', () => {
    prepararComercio({
      productos: [
        productoPrueba({
          precio: Number.MAX_SAFE_INTEGER,
        }),
        segundoProducto({
          precio: 1,
        }),
      ],
      carrito: [
        itemPrueba({
          cantidad: 1,
        }),
        itemPrueba({
          id: 2,
          cantidad: 1,
        }),
      ],
    })

    expect(
      obtenerCodigoError(
        () => obtenerResumenPedido(),
      ),
    ).toBe('DATOS_INVALIDOS')
  })

  it('confirma el pedido, descuenta stock y vacía el carrito conservando otros productos y pedidos', async () => {
    const anterior = pedidoPrueba({
      id: 4,
    })

    prepararComercio({
      pedidos: [anterior],
      ultimoIdPedido: 3,
    })

    const resumen = obtenerResumenPedido()
    const nuevo = await confirmarPedido(resumen)

    expect(nuevo).toEqual({
      id: 5,
      correoCliente: cliente.correo,
      estado: 'Pendiente',
      fechaCreacion: expect.any(String),
      fechaActualizacion: expect.any(String),
      total: 10000,
      articulos: [articuloPrueba()],
      motivoCancelacion: null,
    })

    expect(
      Number.isNaN(
        Date.parse(nuevo.fechaCreacion),
      ),
    ).toBe(false)

    expect(
      nuevo.fechaActualizacion,
    ).toBe(nuevo.fechaCreacion)

    const estado = leerGuardado()

    expect(estado.productos[0].stock).toBe(8)

    expect(
      estado.productos[1],
    ).toEqual(segundoProducto())

    expect(estado.carrito).toEqual([])

    expect(estado.pedidos).toEqual([
      anterior,
      nuevo,
    ])

    expect(estado.ultimoIdPedido).toBe(5)
  })

  it('rechaza confirmar sin un resumen esperado', async () => {
    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      confirmarPedido(),
    ).rejects.toMatchObject({
      codigo: 'RESUMEN_CAMBIADO',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('rechaza la confirmación si el precio cambió desde la preparación del resumen', async () => {
    const resumen = obtenerResumenPedido()

    prepararComercio({
      productos: [
        productoPrueba({ precio: 6000 }),
        segundoProducto(),
      ],
    })

    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      confirmarPedido(resumen),
    ).rejects.toMatchObject({
      codigo: 'RESUMEN_CAMBIADO',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })

  it('rechaza generar un identificador de pedido fuera del rango seguro', async () => {
    prepararComercio({
      ultimoIdPedido: Number.MAX_SAFE_INTEGER,
    })

    const resumen = obtenerResumenPedido()

    await expect(
      confirmarPedido(resumen),
    ).rejects.toMatchObject({
      codigo: 'DATOS_INVALIDOS',
    })

    expect(
      leerGuardado().pedidos,
    ).toEqual([])
  })

  it.each([
    ['Pendiente', 'En preparación'],
    ['En preparación', 'Enviado'],
    ['Enviado', 'Entregado'],
  ])(
    'permite al administrador avanzar de %s a %s',
    async (actual, siguiente) => {
      guardarSesion(administrador)

      const otroPedido = pedidoPrueba({
        id: 2,
      })

      prepararComercio({
        pedidos: [
          pedidoPrueba({
            estado: actual,
          }),
          otroPedido,
        ],
        ultimoIdPedido: 2,
      })

      const resultado =
        await cambiarEstadoPedido(
          1,
          siguiente,
        )

      expect(resultado[0].estado).toBe(
        siguiente,
      )

      expect(
        Date.parse(
          resultado[0].fechaActualizacion,
        ),
      ).toBeGreaterThanOrEqual(
        Date.parse(fecha),
      )

      expect(resultado[1]).toEqual(
        otroPedido,
      )

      expect(
        leerGuardado().pedidos,
      ).toEqual(resultado)

      expect(
        leerGuardado().productos[0].stock,
      ).toBe(10)
    },
  )

  it('impide al cliente avanzar el estado de un pedido', async () => {
    prepararComercio({
      pedidos: [pedidoPrueba()],
    })

    await expect(
      cambiarEstadoPedido(
        1,
        'En preparación',
      ),
    ).rejects.toMatchObject({
      codigo: 'OPERACION_NO_PERMITIDA',
    })
  })

  it('impide saltar estados', async () => {
    guardarSesion(administrador)

    prepararComercio({
      pedidos: [pedidoPrueba()],
    })

    await expect(
      cambiarEstadoPedido(1, 'Enviado'),
    ).rejects.toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
    })

    expect(
      leerGuardado().pedidos[0].estado,
    ).toBe('Pendiente')
  })

  it.each([
    'Entregado',
    'Cancelado',
  ])(
    'impide avanzar un pedido cerrado en estado %s',
    async (estado) => {
      guardarSesion(administrador)

      prepararComercio({
        pedidos: [
          pedidoPrueba({ estado }),
        ],
      })

      await expect(
        cambiarEstadoPedido(
          1,
          'En preparación',
        ),
      ).rejects.toMatchObject({
        codigo: 'PEDIDO_CERRADO',
      })
    },
  )

  it('rechaza una operación sobre un pedido inexistente', async () => {
    guardarSesion(administrador)

    await expect(
      cambiarEstadoPedido(
        999,
        'En preparación',
      ),
    ).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_DISPONIBLE',
    })
  })

  it('permite al cliente cancelar su pedido y devuelve stock una sola vez', async () => {
    const otroPedido = pedidoPrueba({
      id: 2,
    })

    prepararComercio({
      pedidos: [
        pedidoPrueba(),
        otroPedido,
      ],
      ultimoIdPedido: 2,
    })

    const resultado = await cancelarPedido(
      1,
      '  Ya no lo necesito  ',
    )

    expect(
      resultado.esAdministrador,
    ).toBe(false)

    expect(
      resultado.pedidos[0].estado,
    ).toBe('Cancelado')

    expect(
      resultado.pedidos[0]
        .motivoCancelacion,
    ).toBe('Ya no lo necesito')

    expect(
      resultado.pedidos[1],
    ).toEqual(otroPedido)

    expect(
      leerGuardado().productos[0].stock,
    ).toBe(12)

    expect(
      leerGuardado().productos[1].stock,
    ).toBe(20)

    const trasCancelar =
      localStorage.getItem(CLAVE_COMERCIO)

    await expect(
      cancelarPedido(1),
    ).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_CANCELABLE',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(trasCancelar)
  })

  it('impide al cliente cancelar un pedido ajeno', async () => {
    prepararComercio({
      pedidos: [
        pedidoPrueba({
          correoCliente: 'otra@duocuc.cl',
        }),
      ],
    })

    await expect(
      cancelarPedido(1),
    ).rejects.toMatchObject({
      codigo: 'OPERACION_NO_PERMITIDA',
    })

    expect(
      leerGuardado().productos[0].stock,
    ).toBe(10)
  })

  it('permite al administrador cancelar un pedido enviado y limita el motivo a 200 caracteres', async () => {
    guardarSesion(administrador)

    prepararComercio({
      pedidos: [
        pedidoPrueba({
          estado: 'Enviado',
        }),
      ],
    })

    const resultado = await cancelarPedido(
      1,
      'a'.repeat(250),
    )

    expect(
      resultado.esAdministrador,
    ).toBe(true)

    expect(
      resultado.pedidos[0]
        .motivoCancelacion,
    ).toBe('a'.repeat(200))

    expect(
      leerGuardado().productos[0].stock,
    ).toBe(12)
  })

  it('permite cancelar desde el cambio de estado administrativo', async () => {
    guardarSesion(administrador)

    prepararComercio({
      pedidos: [
        pedidoPrueba({
          estado: 'En preparación',
        }),
      ],
    })

    const resultado =
      await cambiarEstadoPedido(
        1,
        'Cancelado',
      )

    expect(
      resultado[0].estado,
    ).toBe('Cancelado')

    expect(
      resultado[0].motivoCancelacion,
    ).toBe('')

    expect(
      leerGuardado().productos[0].stock,
    ).toBe(12)
  })

  it('impide cancelar un pedido entregado', async () => {
    prepararComercio({
      pedidos: [
        pedidoPrueba({
          estado: 'Entregado',
        }),
      ],
    })

    await expect(
      cancelarPedido(1),
    ).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_CANCELABLE',
    })
  })

  it('rechaza devolver stock si el resultado excede el rango seguro', async () => {
    prepararComercio({
      productos: [
        productoPrueba({
          stock: Number.MAX_SAFE_INTEGER,
        }),
      ],
      pedidos: [pedidoPrueba()],
    })

    const inicial = localStorage.getItem(
      CLAVE_COMERCIO,
    )

    await expect(
      cancelarPedido(1),
    ).rejects.toMatchObject({
      codigo: 'DATOS_INVALIDOS',
    })

    expect(
      localStorage.getItem(CLAVE_COMERCIO),
    ).toBe(inicial)
  })
})