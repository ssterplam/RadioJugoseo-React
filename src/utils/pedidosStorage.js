import { leerSesion } from '../data/sesion.js'
import { validarCarrito } from './carritoStorage.js'
import {
  validarLista as validarCatalogo,
} from './productosStorage.js'
import {
  conBloqueoComercio,  
  guardarComercio,
  leerComercio,
} from './comercioStorage.js'

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

function rechazar(codigo, mensaje) {
  const error = new Error(mensaje)
  error.codigo = codigo
  throw error
}

function exigirSesion() {
  const sesion = leerSesion()

  if (!sesion) {
    rechazar(
      'SESION_REQUERIDA',
      'Debes volver a iniciar sesión.',
    )
  }

  return sesion
}

function exigirAdministrador(sesion) {
  if (sesion.rol !== 'Administrador') {
    rechazar(
      'OPERACION_NO_PERMITIDA',
      'Operación no permitida.',
    )
  }
}

function fechaValida(valor) {
  return (
    typeof valor === 'string' &&
    valor.trim() !== '' &&
    Number.isFinite(Date.parse(valor))
  )
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
    articulo.cantidad > 0 &&
    Number.isSafeInteger(articulo.subtotal) &&
    articulo.subtotal >= 0 &&
    articulo.subtotal ===
      articulo.precio * articulo.cantidad
  )
}

function validarPedido(pedido) {
  const estructuraValida =
    pedido !== null &&
    typeof pedido === 'object' &&
    Number.isSafeInteger(pedido.id) &&
    pedido.id > 0 &&
    typeof pedido.correoCliente === 'string' &&
    pedido.correoCliente.trim() !== '' &&
    ESTADOS_PEDIDO.includes(pedido.estado) &&
    fechaValida(pedido.fechaCreacion) &&
    fechaValida(pedido.fechaActualizacion) &&
    Date.parse(pedido.fechaActualizacion) >=
      Date.parse(pedido.fechaCreacion) &&
    Number.isSafeInteger(pedido.total) &&
    pedido.total >= 0 &&
    Array.isArray(pedido.articulos) &&
    pedido.articulos.length > 0 &&
    pedido.articulos.every(esArticuloValido) &&
    (
      pedido.motivoCancelacion == null ||
      (
        typeof pedido.motivoCancelacion === 'string' &&
        pedido.motivoCancelacion.length <= 200
      )
    )

  if (!estructuraValida) {
    throw new Error('Hay un pedido con datos inválidos.')
  }

  const ids = pedido.articulos.map((articulo) => articulo.id)

  const totalCalculado = pedido.articulos.reduce(
    (total, articulo) => total + articulo.subtotal,
    0,
  )

  if (
    new Set(ids).size !== ids.length ||
    !Number.isSafeInteger(totalCalculado) ||
    totalCalculado !== pedido.total
  ) {
    throw new Error('El contenido del pedido no es válido.')
  }
}

function validarPedidos(pedidos) {
  if (!Array.isArray(pedidos)) {
    throw new Error('La lista de pedidos no es válida.')
  }

  pedidos.forEach(validarPedido)

  const ids = pedidos.map((pedido) => pedido.id)

  if (new Set(ids).size !== ids.length) {
    throw new Error('Hay identificadores de pedidos repetidos.')
  }
}

function leerEstadoValidado() {
  const estado = leerComercio()

  validarCatalogo(estado.productos)
  validarPedidos(estado.pedidos)

  return estado
}

function guardarEstado(estado) {
  validarCatalogo(estado.productos)
  validarPedidos(estado.pedidos)

  guardarComercio(estado)
}

function obtenerObjetivo(estado, id, sesion) {
  const pedido = estado.pedidos.find(
    (item) => item.id === id,
  )

  if (!pedido) {
    rechazar(
      'PEDIDO_NO_DISPONIBLE',
      'El pedido no está disponible.',
    )
  }

  const esAdministrador = sesion.rol === 'Administrador'
  const esPropio = pedido.correoCliente === sesion.correo

  if (!esAdministrador && !esPropio) {
    rechazar(
      'OPERACION_NO_PERMITIDA',
      'Operación no permitida.',
    )
  }

  return pedido
}

function actualizarFecha(pedido) {
  return new Date(
    Math.max(
      Date.now(),
      Date.parse(pedido.fechaActualizacion),
    ),
  ).toISOString()
}

export function obtenerSiguienteEstado(estado) {
  return SIGUIENTE_ESTADO[estado] || null
}

export function obtenerPedidos() {
  const { pedidos } = leerComercio()

  validarPedidos(pedidos)

  return pedidos
}

export function obtenerPedidosPropios() {
  const sesion = exigirSesion()

  return obtenerPedidos().filter(
    (pedido) => pedido.correoCliente === sesion.correo,
  )
}

export function obtenerPedidosAdministrables() {
  const sesion = exigirSesion()

  exigirAdministrador(sesion)

  return obtenerPedidos()
}

function prepararResumen(estado, sesion) {
  const carrito = estado.carrito

  validarCarrito(carrito)

  if (carrito.length === 0) {
    rechazar('CARRITO_VACIO', 'El carrito está vacío.')
  }

  const porId = new Map(
    estado.productos.map((producto) => [
      producto.id,
      producto,
    ]),
  )

  const articulos = carrito.map((item) => {
    const producto = porId.get(item.id)

    if (!producto) {
      rechazar(
        'PRODUCTO_NO_DISPONIBLE',
        `El producto "${item.nombre}" ya no está disponible.`,
      )
    }

    if (
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad < 1 ||
      item.cantidad > producto.stock
    ) {
      rechazar(
        'STOCK_INSUFICIENTE',
        `Revisa la cantidad de "${producto.nombre}". ` +
          `Hay ${producto.stock} unidades disponibles.`,
      )
    }

    const subtotal = producto.precio * item.cantidad

    if (!Number.isSafeInteger(subtotal)) {
      rechazar(
        'DATOS_INVALIDOS',
        'El importe del pedido no es válido.',
      )
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: item.cantidad,
      subtotal,
    }
  })

  articulos.sort((a, b) => a.id - b.id)

  const total = articulos.reduce(
    (acumulado, articulo) => acumulado + articulo.subtotal,
    0,
  )

  if (!Number.isSafeInteger(total)) {
    rechazar(
      'DATOS_INVALIDOS',
      'El total del pedido no es válido.',
    )
  }

  return {
    correoCliente: sesion.correo,
    cuentaId: sesion.cuentaId ?? null,
    versionCuenta: sesion.versionCuenta ?? 0,
    articulos,
    total,
  }
}

export function obtenerResumenPedido() {
  const sesion = exigirSesion()
  const estado = leerEstadoValidado()

  return prepararResumen(estado, sesion)
}

function confirmarPedidoInterno(resumenEsperado) {
  const sesion = exigirSesion()
  const estado = leerEstadoValidado()

  const resumenActual = prepararResumen(
    estado,
    sesion,
  )

  if (
    !resumenEsperado ||
    JSON.stringify(resumenEsperado) !==
      JSON.stringify(resumenActual)
  ) {
    rechazar(
      'RESUMEN_CAMBIADO',
      'El carrito, sus precios o la cuenta cambiaron. ' +
        'Revisa el resumen y vuelve a confirmar.',
    )
  }

  const { articulos, total } = resumenActual

  const mayorId = estado.pedidos.reduce(
    (mayor, pedido) => Math.max(mayor, pedido.id),
    estado.ultimoIdPedido,
  )

  const id = mayorId + 1

  if (!Number.isSafeInteger(id)) {
    rechazar(
      'DATOS_INVALIDOS',
      'No se pudo generar el identificador del pedido.',
    )
  }

  const fecha = new Date().toISOString()

  const nuevoPedido = {
    id,
    correoCliente: sesion.correo,
    estado: 'Pendiente',
    fechaCreacion: fecha,
    fechaActualizacion: fecha,
    total,
    articulos,
    motivoCancelacion: null,
  }

  const cantidades = new Map(
    articulos.map((articulo) => [
      articulo.id,
      articulo.cantidad,
    ]),
  )

  const productos = estado.productos.map((producto) => ({
    ...producto,
    stock:
      producto.stock -
      (cantidades.get(producto.id) || 0),
  }))

  guardarEstado({
    ...estado,
    productos,
    carrito: [],
    pedidos: [...estado.pedidos, nuevoPedido],
    ultimoIdPedido: id,
  })

  return nuevoPedido
}

function cambiarEstadoPedidoInterno(id, nuevoEstado) {
  const sesion = exigirSesion()

  exigirAdministrador(sesion)

  if (nuevoEstado === 'Cancelado') {
    return cancelarPedidoInterno(id, '').pedidos
  }

  const estado = leerEstadoValidado()
  const pedido = obtenerObjetivo(estado, id, sesion)

  if (
    pedido.estado === 'Entregado' ||
    pedido.estado === 'Cancelado'
  ) {
    rechazar(
      'PEDIDO_CERRADO',
      'Este pedido ya está cerrado.',
    )
  }

  if (
    nuevoEstado !== obtenerSiguienteEstado(pedido.estado)
  ) {
    rechazar(
      'TRANSICION_INVALIDA',
      'El pedido solo puede avanzar al siguiente estado.',
    )
  }

  const pedidos = estado.pedidos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: nuevoEstado,
          fechaActualizacion: actualizarFecha(item),
        }
      : item,
  )

  guardarEstado({
    ...estado,
    pedidos,
  })

  return pedidos
}

function cancelarPedidoInterno(id, motivo = '') {
  const sesion = exigirSesion()
  const estado = leerEstadoValidado()
  const pedido = obtenerObjetivo(estado, id, sesion)

  if (!ESTADOS_CANCELABLES.includes(pedido.estado)) {
    rechazar(
      'PEDIDO_NO_CANCELABLE',
      'Este pedido no puede cancelarse.',
    )
  }

  const cantidades = new Map(
    pedido.articulos.map((articulo) => [
      articulo.id,
      articulo.cantidad,
    ]),
  )

  const productos = estado.productos.map((producto) => {
    const stock =
      producto.stock +
      (cantidades.get(producto.id) || 0)

    if (!Number.isSafeInteger(stock)) {
      rechazar(
        'DATOS_INVALIDOS',
        'No se pudo calcular la devolución de stock.',
      )
    }

    return {
      ...producto,
      stock,
    }
  })

  const pedidos = estado.pedidos.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: 'Cancelado',
          fechaActualizacion: actualizarFecha(item),
          motivoCancelacion:
            typeof motivo === 'string'
              ? motivo.trim().slice(0, 200)
              : '',
        }
      : item,
  )

  guardarEstado({
    ...estado,
    productos,
    pedidos,
  })

  return {
    pedidos,
    esAdministrador: sesion.rol === 'Administrador',
  }
}

export function confirmarPedido(resumenEsperado) {
  return conBloqueoComercio(() =>
    confirmarPedidoInterno(resumenEsperado),
  )
}

export function cambiarEstadoPedido(id, nuevoEstado) {
  return conBloqueoComercio(() =>
    cambiarEstadoPedidoInterno(id, nuevoEstado),
  )
}

export function cancelarPedido(id, motivo = '') {
  return conBloqueoComercio(() =>
    cancelarPedidoInterno(id, motivo),
  )
}