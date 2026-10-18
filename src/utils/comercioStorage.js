import {
  CLAVE_PRODUCTOS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

export const CLAVE_COMERCIO = 'jugoseoComercio'

const NOMBRE_BLOQUEO = 'jugoseo-comercio-escritura'

let bloqueoActivo = false

function leerAnterior(clave, valorInicial) {
  const texto = localStorage.getItem(clave)

  return texto === null
    ? valorInicial
    : JSON.parse(texto)
}

function leerCarritoAnterior(permitirCarritoInvalido) {
  const texto = localStorage.getItem('jugoseoCarrito')

  if (texto === null) {
    return []
  }

  try {
    return JSON.parse(texto)
  } catch (error) {
    if (!permitirCarritoInvalido) {
      throw error
    }

    return null
  }
}

function validarEstructura(
  estado,
  permitirCarritoInvalido = false,
) {
  if (
    !estado ||
    typeof estado !== 'object' ||
    Array.isArray(estado) ||
    estado.version !== 1 ||
    !Array.isArray(estado.productos) ||
    (
      !permitirCarritoInvalido &&
      !Array.isArray(estado.carrito)
    ) ||
    !Array.isArray(estado.pedidos) ||
    !Number.isSafeInteger(estado.ultimoIdPedido) ||
    estado.ultimoIdPedido < 0
  ) {
    throw new Error(
      'No se pudo leer el almacenamiento de comercio.',
    )
  }
}

export function leerComercio({
  permitirCarritoInvalido = false,
} = {}) {
  const texto = localStorage.getItem(CLAVE_COMERCIO)

  if (texto !== null) {
    const estado = JSON.parse(texto)

    validarEstructura(
      estado,
      permitirCarritoInvalido,
    )

    return estado
  }

  const secuenciaAnterior = localStorage.getItem(
    'jugoseoUltimoIdPedido',
  )

  const estado = {
    version: 1,
    productos: leerAnterior(
      CLAVE_PRODUCTOS,
      PRODUCTOS_INICIALES.map((producto) => ({
        ...producto,
      })),
    ),
    carrito: leerCarritoAnterior(
      permitirCarritoInvalido,
    ),
    pedidos: leerAnterior('jugoseoPedidos', []),
    ultimoIdPedido:
      secuenciaAnterior === null
        ? 0
        : Number(secuenciaAnterior),
  }

  validarEstructura(
    estado,
    permitirCarritoInvalido,
  )

  return estado
}

export function guardarComercio(estado) {
  if (!bloqueoActivo) {
    throw new Error(
      'La escritura de comercio requiere el bloqueo común.',
    )
  }

  validarEstructura(estado)

  const texto = JSON.stringify(estado)

  localStorage.setItem(CLAVE_COMERCIO, texto)
}

export async function conBloqueoComercio(tarea) {
  if (
    typeof navigator === 'undefined' ||
    !navigator.locks?.request
  ) {
    const error = new Error(
      'Este navegador o dirección no permite coordinar ' +
        'el almacenamiento. Utiliza localhost o HTTPS ' +
        'en un navegador compatible.',
    )

    error.codigo = 'BLOQUEO_NO_DISPONIBLE'
    throw error
  }

  return navigator.locks.request(
    NOMBRE_BLOQUEO,
    { mode: 'exclusive' },
    () => {
      bloqueoActivo = true

      try {
        const resultado = tarea()

        if (
          resultado &&
          typeof resultado.then === 'function'
        ) {
          throw new Error(
            'La operación interna de comercio debe ser síncrona.',
          )
        }

        return resultado
      } finally {
        bloqueoActivo = false
      }
    },
  )
}