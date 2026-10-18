import {
  CATEGORIAS_VALIDAS,
  PRODUCTOS_INICIALES,
} from '../data/productos.js'

import { leerSesion } from '../data/sesion.js'

import { obtenerCarrito } from './carritoStorage.js'
import { validarProducto } from './validacionesProducto.js'

import {
  conBloqueoComercio,
  guardarComercio,
  leerComercio,
} from './comercioStorage.js'

const CLAVE_SECUENCIA = 'jugoseoUltimoIdProducto'

export function esProductoValido(producto) {
  return (
    producto !== null &&
    typeof producto === 'object' &&
    Number.isSafeInteger(producto.id) &&
    producto.id > 0 &&
    typeof producto.nombre === 'string' &&
    producto.nombre.trim() !== '' &&
    producto.nombre.length <= 100 &&
    CATEGORIAS_VALIDAS.includes(producto.categoria) &&
    typeof producto.imagen === 'string' &&
    producto.imagen.trim() !== '' &&
    Number.isSafeInteger(producto.precio) &&
    producto.precio >= 0 &&
    Number.isSafeInteger(producto.stock) &&
    producto.stock >= 0
  )
}

function exigirAdministrador() {
  const sesion = leerSesion()

  if (!sesion || sesion.rol !== 'Administrador') {
    throw new Error('Operación no permitida.')
  }
}

export function validarLista(productos) {
  if (
    !Array.isArray(productos) ||
    !productos.every(esProductoValido)
  ) {
    throw new Error('El catálogo contiene datos inválidos.')
  }

  const ids = productos.map((producto) => producto.id)

  if (new Set(ids).size !== ids.length) {
    throw new Error('Hay identificadores repetidos.')
  }

  const codigos = productos.map((producto) =>
    String(producto.codigo || '').trim().toUpperCase(),
  )

  if (
    codigos.some((codigo) => !codigo) ||
    new Set(codigos).size !== codigos.length
  ) {
    throw new Error('Los códigos del catálogo no son válidos.')
  }
}

export function obtenerProductos() {
  return leerComercio().productos
}

export function guardarProductos(productos) {
  exigirAdministrador()
  validarLista(productos)

  const estado = leerComercio()

  guardarComercio({
    ...estado,
    productos,
  })
}

export function obtenerProductosAdministrables() {
  exigirAdministrador()

  const productos = obtenerProductos()

  validarLista(productos)

  return productos
}

function reservarId(productos) {
  const guardado = localStorage.getItem(CLAVE_SECUENCIA)
  const ultimo = guardado === null ? 0 : Number(guardado)

  if (!Number.isSafeInteger(ultimo) || ultimo < 0) {
    throw new Error('No se pudo generar el identificador.')
  }

  const mayorActual = productos.reduce(
    (mayor, producto) => Math.max(mayor, producto.id),
    0,
  )

  const mayorInicial = PRODUCTOS_INICIALES.reduce(
    (mayor, producto) => Math.max(mayor, producto.id),
    0,
  )

  const nuevoId = Math.max(
    ultimo,
    mayorActual,
    mayorInicial,
  ) + 1

  if (!Number.isSafeInteger(nuevoId)) {
    throw new Error('No se pudo generar el identificador.')
  }

  localStorage.setItem(
    CLAVE_SECUENCIA,
    String(nuevoId),
  )

  return nuevoId
}

function prepararDatos(datos) {
  return {
    codigo: datos.codigo.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria,
    precio: Number(datos.precio),
    stock: Number(datos.stock),
    imagen: `img/${datos.imagen.trim()}`,
  }
}

function crearProductoInterno(datos) {
  exigirAdministrador()

  const productos = obtenerProductosAdministrables()
  const errores = validarProducto(datos, productos)

  if (Object.keys(errores).length > 0) {
    throw new Error('Los datos ingresados no son válidos.')
  }

  const nuevo = {
    id: reservarId(productos),
    ...prepararDatos(datos),
  }

  const actualizados = [
    ...productos,
    nuevo,
  ]

  guardarProductos(actualizados)

  return actualizados
}

function actualizarProductoInterno(
  id,
  datos,
  productoEsperado,
) {
  exigirAdministrador()

  const productos = obtenerProductosAdministrables()

  const productoActual = productos.find(
    (producto) => producto.id === id,
  )

  if (!productoActual) {
    throw new Error('El producto no está disponible.')
  }

  if (
    !productoEsperado ||
    JSON.stringify(productoActual) !==
      JSON.stringify(productoEsperado)
  ) {
    const error = new Error(
      'El producto cambió desde que abriste el formulario. ' +
        'Ciérralo y vuelve a abrirlo para revisar los datos actuales.',
    )

    error.codigo = 'PRODUCTO_CAMBIADO'
    throw error
  }

  const errores = validarProducto(
    datos,
    productos,
    id,
  )

  if (Object.keys(errores).length > 0) {
    throw new Error('Los datos ingresados no son válidos.')
  }

  const contenido = prepararDatos(datos)

  const actualizados = productos.map((producto) =>
    producto.id === id
      ? {
          ...producto,
          ...contenido,
        }
      : producto,
  )

  guardarProductos(actualizados)

  return actualizados
}

function eliminarProductoInterno(id) {
  exigirAdministrador()

  const productos = obtenerProductosAdministrables()

  if (!productos.some((producto) => producto.id === id)) {
    throw new Error('El producto no está disponible.')
  }

  const estaEnCarrito = obtenerCarrito().some(
    (item) => item.id === id,
  )

  if (estaEnCarrito) {
    const error = new Error(
      'El producto está en el carrito.',
    )

    error.codigo = 'PRODUCTO_EN_CARRITO'
    throw error
  }

  const actualizados = productos.filter(
    (producto) => producto.id !== id,
  )

  guardarProductos(actualizados)

  return actualizados
}

export function crearProducto(datos) {
  return conBloqueoComercio(() =>
    crearProductoInterno(datos),
  )
}

export function actualizarProducto(
  id,
  datos,
  productoEsperado,
) {
  return conBloqueoComercio(() =>
    actualizarProductoInterno(
      id,
      datos,
      productoEsperado,
    ),
  )
}

export function eliminarProductoAdministrativo(id) {
  return conBloqueoComercio(() =>
    eliminarProductoInterno(id),
  )
}