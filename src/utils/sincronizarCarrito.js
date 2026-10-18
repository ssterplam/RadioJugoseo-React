import {
  esProductoValido,
  obtenerProductos,
} from './productosStorage.js'

import { obtenerCarrito } from './carritoStorage.js'
import { formatearCLP } from './formatoMoneda.js'

export function reconciliarCarrito(items, productos) {
  const porId = new Map(
    productos.map((producto) => [producto.id, producto]),
  )

  const conflictos = {}
  const cambios = []
  let requiereGuardado = false

  const actualizados = items.map((item) => {
    const producto = porId.get(item.id)

    if (!producto) {
      conflictos[item.id] =
        'Producto no disponible. Quita este artículo para continuar.'

      return { ...item }
    }

    if (item.nombre !== producto.nombre) {
      cambios.push(
        `El nombre "${item.nombre}" se actualizó a "${producto.nombre}".`,
      )
      requiereGuardado = true
    }

    if (item.precio !== producto.precio) {
      cambios.push(
        `El precio de "${producto.nombre}" cambió de ` +
          `${formatearCLP(item.precio)} a ${formatearCLP(producto.precio)}.`,
      )
      requiereGuardado = true
    }

    if (producto.stock === 0) {
      conflictos[item.id] =
        'Producto agotado. Quita este artículo para continuar.'
    } else if (item.cantidad > producto.stock) {
      conflictos[item.id] =
        `Hay ${producto.stock} unidades disponibles. ` +
        'Reduce la cantidad para continuar.'
    }

    return {
      id: item.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: item.cantidad,
    }
  })

  return {
    items: actualizados,
    conflictos,
    cambios,
    requiereGuardado,
  }
}

export function leerEstadoTienda() {
  const inicial = {
    productos: [],
    items: [],
    conflictos: {},
    cambios: [],
    requiereGuardado: false,
    errorCatalogo: '',
    errorCarrito: '',
  }

  let productos

  try {
    productos = obtenerProductos()

    const ids = productos.map((producto) => producto?.id)

    if (
      !productos.every(esProductoValido) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error('Catálogo inválido.')
    }
  } catch {
    return {
      ...inicial,
      errorCatalogo:
        'No se pudo consultar el catálogo. Inténtalo nuevamente.',
    }
  }

  try {
    const items = obtenerCarrito()

    return {
      ...inicial,
      productos,
      ...reconciliarCarrito(items, productos),
    }
  } catch {
    return {
      ...inicial,
      productos,
      errorCarrito:
        'No se pudo leer el carrito guardado. Sus datos no se reemplazaron.',
    }
  }
}