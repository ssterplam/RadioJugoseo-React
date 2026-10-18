import {
  guardarComercio,
  leerComercio,
} from './comercioStorage.js'

function esItemValido(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    Number.isInteger(item.id) &&
    item.id > 0 &&
    typeof item.nombre === 'string' &&
    item.nombre.trim() !== '' &&
    Number.isFinite(item.precio) &&
    item.precio >= 0 &&
    Number.isInteger(item.cantidad) &&
    item.cantidad > 0
  )
}

function validarLista(items) {
  if (!Array.isArray(items) || !items.every(esItemValido)) {
    throw new Error('El carrito contiene datos inválidos.')
  }

  const ids = items.map((item) => item.id)

  if (new Set(ids).size !== ids.length) {
    throw new Error('El carrito contiene productos repetidos.')
  }
}

export function obtenerCarrito() {
  const { carrito } = leerComercio()

  validarLista(carrito)

  return carrito
}

export function guardarCarrito(items) {
  validarLista(items)

  const estado = leerComercio()

  guardarComercio({
    ...estado,
    carrito: items,
  })
}

export { validarLista as validarCarrito }