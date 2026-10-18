import { leerSesion } from '../data/sesion.js'

import { obtenerCarrito } from './carritoStorage.js'
import {
  obtenerProductos,
} from './productosStorage.js'

const CLAVE_PEDIDOS = 'jugoseoPedidos'
const CLAVE_SECUENCIA = 'jugoseoUltimoIdPedido'

export const ESTADOS_PEDIDO = [
  'Pendiente',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
]

const ESTADOS_CANCELABLES = [
  'Pendiente',
  'En preparación',
  'Enviado',
]

const SIGUIENTE_ESTADO = {
  Pendiente: 'En preparación',
  'En preparación': 'Enviado',
  Enviado: 'Entregado',
}

export function obtenerSiguienteEstado(estado) {
  return SIGUIENTE_ESTADO[estado] || null
}

function leerPedidosGuardados() {
  const texto = localStorage.getItem(CLAVE_PEDIDOS)

  if (texto === null) {
    return []
  }

  const pedidos = JSON.parse(texto)

  if (!Array.isArray(pedidos)) {
    throw new Error('La lista de pedidos no es válida.')
  }

  return pedidos
}

function esArticuloValido(articulo) {
  return (
    articulo !== null &&
    typeof articulo === 'object' &&
    Number.isSafeInteger(articulo.id) &&
    articulo.id > 0 &&
    typeof articulo.nombre === 'string' &&
    articulo.nombre.trim() !== '' &&
    Number.isSafeInteger(articulo.precio) &&
    articulo.precio >= 0 &&
    Number.isSafeInteger(articulo.cantidad) &&
    articulo.cantidad > 0
  )
}

function validarPedido(pedido) {
  const valido =
    pedido !== null &&
    typeof pedido === 'object' &&
    Number.isSafeInteger(pedido.id) &&
    pedido.id > 0 &&
    typeof pedido.correoCliente === 'string' &&
    pedido.correoCliente.trim() !== '' &&
    ESTADOS_PEDIDO.includes(pedido.estado) &&
    typeof pedido.fechaCreacion === 'string' &&
    pedido.fechaCreacion !== '' &&
    typeof pedido.fechaActualizacion === 'string' &&
    pedido.fechaActualizacion !== '' &&
    Number.isSafeInteger(pedido.total) &&
    pedido.total >= 0 &&
    Array.isArray(pedido.articulos) &&
    pedido.articulos.length > 0 &&
    pedido.articulos.every(esArticuloValido)

  if (!valido) {
    throw new Error('Hay un pedido guardado con datos inválidos.')
  }
}

function validarLista(pedidos) {
  if (!Array.isArray(pedidos)) {
    throw new Error('La lista de pedidos no es válida.')
  }

  pedidos.forEach(validarPedido)

  const ids = pedidos.map((pedido) => pedido.id)

  if (new Set(ids).size !== ids.length) {
    throw new Error('Hay identificadores de pedidos repetidos.')
  }
}

function guardarPedidos(pedidos) {
  validarLista(pedidos)

  localStorage.setItem(
    CLAVE_PEDIDOS,
    JSON.stringify(pedidos),
  )
}

function reservarId(pedidos) {
  const guardado = localStorage.getItem(CLAVE_SECUENCIA)
  const ultimo = guardado === null ? 0 : Number(guardado)

  if (!Number.isSafeInteger(ultimo) || ultimo < 0) {
    throw new Error('No se pudo generar el identificador.')
  }

  const mayorActual = pedidos.reduce(
    (mayor, pedido) => Math.max(mayor, pedido.id),
    0,
  )

  const nuevoId = Math.max(ultimo, mayorActual) + 1

  if (!Number.isSafeInteger(nuevoId)) {
    throw new Error('No se pudo generar el identificador.')
  }

  localStorage.setItem(CLAVE_SECUENCIA, String(nuevoId))

  return nuevoId
}

function exigirSesion() {
  const sesion = leerSesion()

  if (!sesion) {
    const error = new Error('Debes iniciar sesión.')
    error.codigo = 'SESION_REQUERIDA'
    throw error
  }

  return sesion
}

export function obtenerPedidos() {
  const pedidos = leerPedidosGuardados()
  validarLista(pedidos)

  return pedidos
}

export function obtenerPedidosPropios() {
  const sesion = exigirSesion()

  return obtenerPedidos().filter(
    (pedido) =>
      pedido.correoCliente === sesion.correo,
  )
}

export function obtenerPedidosAdministrables() {
  const sesion = exigirSesion()

  if (sesion.rol !== 'Administrador') {
    const error = new Error('Operación no permitida.')
    error.codigo = 'OPERACION_NO_PERMITIDA'
    throw error
  }

  return obtenerPedidos()
}

export function confirmarPedido() {
  const sesion = exigirSesion()
  const carrito = obtenerCarrito()
  const productos = obtenerProductos()

  if (carrito.length === 0) {
    const error = new Error(
      'El carrito está vacío.',
    )
    error.codigo = 'CARRITO_VACIO'
    throw error
  }

  const productosPorId = new Map(
    productos.map((producto) => [producto.id, producto]),
  )

  const conflictos = carrito.map((item) => {
    const producto = productosPorId.get(item.id)

    if (!producto) {
      return `El producto "${item.nombre}" ya no está disponible.`
    }

    if (producto.stock < item.cantidad) {
      return `Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`
    }

    return null
  }).filter(Boolean)

  if (conflictos.length > 0) {
    const error = new Error(conflictos.join(' '))
    error.codigo = 'STOCK_INSUFICIENTE'
    error.detalles = conflictos
    throw error
  }

  const articulos = carrito.map((item) => {
    const producto = productosPorId.get(item.id)

    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: item.cantidad,
      subtotal: producto.precio * item.cantidad,
    }
  })

  const total = articulos.reduce(
    (acumulado, articulo) =>
      acumulado + articulo.subtotal,
    0,
  )

  const fecha = new Date().toISOString()

  const pedidos = obtenerPedidos()

  const nuevoPedido = {
    id: reservarId(pedidos),
    correoCliente: sesion.correo,
    estado: 'Pendiente',
    fechaCreacion: fecha,
    fechaActualizacion: fecha,
    total,
    articulos,
    motivoCancelacion: null,
  }

  const productosActualizados = productos.map((producto) => {
    const articulo = articulos.find(
      (item) => item.id === producto.id,
    )

    if (!articulo) {
      return producto
    }

    return {
      ...producto,
      stock: producto.stock - articulo.cantidad,
    }
  })

  localStorage.setItem(
    'jugoseoProductos',
    JSON.stringify(productosActualizados),
  )

  localStorage.setItem(
    'jugoseoCarrito',
    JSON.stringify([]),
  )

  guardarPedidos([...pedidos, nuevoPedido])

  return nuevoPedido
}

function obtenerPedidoEditable(id, sesion) {
  const pedidos = obtenerPedidos()
  const pedido = pedidos.find(
    (item) => item.id === id,
  )

  if (!pedido) {
    const error = new Error('El pedido no está disponible.')
    error.codigo = 'PEDIDO_NO_DISPONIBLE'
    throw error
  }

  const esAdministrador = sesion.rol === 'Administrador'
  const esPropio =
    pedido.correoCliente === sesion.correo

  if (!esAdministrador && !esPropio) {
    const error = new Error('Operación no permitida.')
    error.codigo = 'OPERACION_NO_PERMITIDA'
    throw error
  }

  return {
    pedidos,
    pedido,
    esAdministrador,
  }
}

export function cambiarEstadoPedido(id, estado) {
  const sesion = exigirSesion()

  if (sesion.rol !== 'Administrador') {
    const error = new Error('Operación no permitida.')
    error.codigo = 'OPERACION_NO_PERMITIDA'
    throw error
  }

  const {
    pedidos,
    pedido,
  } = obtenerPedidoEditable(id, sesion)

  if (
    pedido.estado === 'Cancelado' ||
    pedido.estado === 'Entregado'
  ) {
    const error = new Error('Este pedido ya está cerrado.')
    error.codigo = 'PEDIDO_CERRADO'
    throw error
  }

  if (estado === 'Cancelado') {
    const resultado = cancelarPedido(id, '')
    return resultado.pedidos
  }

  const siguiente = obtenerSiguienteEstado(pedido.estado)

  if (!siguiente || estado !== siguiente) {
    const error = new Error(
      'El pedido solo puede avanzar al siguiente estado.',
    )
    error.codigo = 'TRANSICION_INVALIDA'
    throw error
  }

  const actualizados = pedidos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado,
          fechaActualizacion: new Date().toISOString(),
        }
      : item,
  )

  guardarPedidos(actualizados)

  return actualizados
}

export function cancelarPedido(id, motivo = '') {
  const sesion = exigirSesion()

  const {
    pedidos,
    pedido,
    esAdministrador,
  } = obtenerPedidoEditable(id, sesion)

  if (!ESTADOS_CANCELABLES.includes(pedido.estado)) {
    const error = new Error(
      'Este pedido no puede cancelarse.',
    )
    error.codigo = 'PEDIDO_NO_CANCELABLE'
    throw error
  }

  const productos = obtenerProductos()

  const productosActualizados = productos.map((producto) => {
    const articulo = pedido.articulos.find(
      (item) => item.id === producto.id,
    )

    if (!articulo) {
      return producto
    }

    return {
      ...producto,
      stock: producto.stock + articulo.cantidad,
    }
  })

  localStorage.setItem(
    'jugoseoProductos',
    JSON.stringify(productosActualizados),
  )

  const actualizados = pedidos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: 'Cancelado',
          fechaActualizacion: new Date().toISOString(),
          motivoCancelacion:
            typeof motivo === 'string'
              ? motivo.trim().slice(0, 200)
              : '',
        }
      : item,
  )

  guardarPedidos(actualizados)

  return {
    pedidos: actualizados,
    esAdministrador,
  }
}