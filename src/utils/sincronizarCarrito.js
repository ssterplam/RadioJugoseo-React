import {
  validarLista as validarCatalogo,
} from './productosStorage.js'
import {
  validarCarrito,
} from './carritoStorage.js'
import {
  leerComercio,
} from './comercioStorage.js'
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

  let estado

  try {
    estado = leerComercio({
      permitirCarritoInvalido: true,
    })

    validarCatalogo(estado.productos)
  } catch {
    return {
      ...inicial,
      errorCatalogo:
        'No se pudo consultar el catálogo o la estructura ' +
        'de comercio. Los datos guardados no se reemplazaron.',
    }
  }

  try {
    validarCarrito(estado.carrito)

    return {
      ...inicial,
      productos: estado.productos,
      ...reconciliarCarrito(
        estado.carrito,
        estado.productos,
      ),
    }
  } catch {
    return {
      ...inicial,
      productos: estado.productos,
      errorCarrito:
        'El carrito guardado contiene datos inválidos. ' +
        'Puedes reiniciarlo sin borrar productos ni pedidos.',
    }
  }
}