import {
  CLAVE_PRODUCTOS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

export const CLAVE_COMERCIO = 'jugoseoComercio'

function leerAnterior(clave, valorInicial) {
  const texto = localStorage.getItem(clave)

  return texto === null
    ? valorInicial
    : JSON.parse(texto)
}

function validarEstructura(estado) {
  if (
    !estado ||
    typeof estado !== 'object' ||
    estado.version !== 1 ||
    !Array.isArray(estado.productos) ||
    !Array.isArray(estado.carrito) ||
    !Array.isArray(estado.pedidos) ||
    !Number.isSafeInteger(estado.ultimoIdPedido) ||
    estado.ultimoIdPedido < 0
  ) {
    throw new Error(
      'No se pudo leer el almacenamiento de comercio.',
    )
  }
}

export function leerComercio() {
  const texto = localStorage.getItem(CLAVE_COMERCIO)

  if (texto !== null) {
    const estado = JSON.parse(texto)
    validarEstructura(estado)
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
    carrito: leerAnterior('jugoseoCarrito', []),
    pedidos: leerAnterior('jugoseoPedidos', []),
    ultimoIdPedido:
      secuenciaAnterior === null
        ? 0
        : Number(secuenciaAnterior),
  }

  validarEstructura(estado)

  return estado
}

export function guardarComercio(estado) {
  validarEstructura(estado)

  const texto = JSON.stringify(estado)

  localStorage.setItem(CLAVE_COMERCIO, texto)
}