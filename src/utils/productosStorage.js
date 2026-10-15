import {
  CATEGORIAS_VALIDAS,
  CLAVE_PRODUCTOS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

export function esProductoValido(producto) {
  return (
    producto !== null &&
    typeof producto === 'object' &&
    Number.isInteger(producto.id) &&
    producto.id > 0 &&
    typeof producto.nombre === 'string' &&
    producto.nombre.trim() !== '' &&
    producto.nombre.length <= 100 &&
    CATEGORIAS_VALIDAS.includes(producto.categoria) &&
    typeof producto.imagen === 'string' &&
    producto.imagen.trim() !== '' &&
    Number.isFinite(producto.precio) &&
    producto.precio >= 0 &&
    Number.isInteger(producto.stock) &&
    producto.stock >= 0
  )
}

export function obtenerProductos() {
  const guardados = localStorage.getItem(CLAVE_PRODUCTOS)

  if (guardados === null) {
    return PRODUCTOS_INICIALES.map((producto) => ({
      ...producto,
    }))
  }

  const productos = JSON.parse(guardados)

  if (!Array.isArray(productos)) {
    throw new Error('El catálogo guardado no es una lista válida.')
  }

  return productos
}

export function guardarProductos(productos) {
  if (!Array.isArray(productos)) {
    throw new Error('Los productos deben entregarse como una lista.')
  }

  if (!productos.every(esProductoValido)) {
    throw new Error('El catálogo contiene productos inválidos.')
  }

  const identificadores = productos.map((producto) => producto.id)

  if (new Set(identificadores).size !== identificadores.length) {
    throw new Error('El catálogo contiene identificadores repetidos.')
  }

  localStorage.setItem(
    CLAVE_PRODUCTOS,
    JSON.stringify(productos),
  )
}