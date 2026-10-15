import { useState } from 'react'

import ProductoCard from './ProductoCard.jsx'
import CarritoPanel from './CarritoPanel.jsx'

import {
  esProductoValido,
  obtenerProductos,
} from '../utils/productosStorage.js'

import {
  obtenerCarrito,
  guardarCarrito,
} from '../utils/carritoStorage.js'

function cargarCatalogo() {
  try {
    const productos = obtenerProductos()
    const identificadores = new Set()
    const validos = []

    for (const producto of productos) {
      if (
        esProductoValido(producto) &&
        !identificadores.has(producto.id)
      ) {
        identificadores.add(producto.id)
        validos.push(producto)
      }
    }

    return {
      productos: validos,
      omitidos: productos.length - validos.length,
      error: '',
    }
  } catch {
    return {
      productos: [],
      omitidos: 0,
      error:
        'No se pudo cargar el catálogo. Revisa el almacenamiento ' +
        'del navegador y los datos guardados. No se reemplazaron tus datos.',
    }
  }
}

function cargarCarritoInicial() {
  try {
    return {
      items: obtenerCarrito(),
      error: '',
    }
  } catch {
    return {
      items: [],
      error:
        'No se pudo leer el carrito guardado. No se modificaron sus datos. ' +
        'Puedes reiniciarlo mediante el botón del panel.',
    }
  }
}

function buscarProductoActual(id) {
  const producto = obtenerProductos().find(
    (item) => item?.id === id,
  )

  if (!esProductoValido(producto)) {
    throw new Error(
      'El producto ya no está disponible o contiene datos inválidos.',
    )
  }

  return producto
}

/*
El estado está en Tienda porque esta coordina las tarjetas, el contador y el panel. 
Los componentes hijos reciben la información y las funciones necesarias para trabajar sobre un único carrito, en vez de mantener copias independientes.
Este patrón consiste en elevar el estado al padre compartido.
*/

export default function Tienda() {
  const [catalogo] = useState(cargarCatalogo)
  const [estadoCarrito, setEstadoCarrito] = useState(cargarCarritoInicial)
  const [mostrarCarrito, setMostrarCarrito] = useState(false)
  const [aviso, setAviso] = useState(null)

  const carrito = estadoCarrito.items

  const totalUnidades = carrito.reduce(
    (acumulado, item) => acumulado + item.cantidad,
    0,
  )

  function notificar(texto, tipo = 'info') {
    setAviso({ texto, tipo })
  }

  function persistir(nuevosItems, mensaje) {
    try {
      guardarCarrito(nuevosItems)

      setEstadoCarrito({
        items: nuevosItems,
        error: '',
      })

      notificar(mensaje, 'success')
      return true
    } catch {
      notificar(
        'No se pudo guardar el cambio. El carrito no se modificó. ' +
          'Revisa el almacenamiento del navegador.',
        'danger',
      )
      return false
    }
  }

  function agregarProducto(id, cantidad) {
    if (estadoCarrito.error) {
      notificar('Primero debes resolver el error del carrito.', 'danger')
      return false
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      notificar('Ingresa una cantidad entera mayor o igual a 1.', 'danger')
      return false
    }

    try {
      const producto = buscarProductoActual(id)
      const existente = carrito.find((item) => item.id === id)
      const cantidadActual = existente?.cantidad || 0

      if (cantidadActual + cantidad > producto.stock) {
        notificar(
          `El stock de "${producto.nombre}" es ${producto.stock}. ` +
            `Ya tienes ${cantidadActual} unidades en el carrito.`,
          'danger',
        )
        return false
      }

      const nuevosItems = existente
        ? carrito.map((item) =>
            item.id === id
              ? {
                  ...item,
                  cantidad: item.cantidad + cantidad,
                }
              : item,
          )
        : [
            ...carrito,
            {
              id: producto.id,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad,
            },
          ]

      return persistir(
        nuevosItems,
        `"${producto.nombre}" se agregó al carrito.`,
      )
    } catch {
      notificar(
        'No se pudo comprobar el producto y su stock. ' +
          'Vuelve a entrar a Tienda y revisa el catálogo.',
        'danger',
      )
      return false
    }
  }

  function cambiarCantidad(id, delta) {
    const item = carrito.find((producto) => producto.id === id)

    if (!item) {
      return
    }

    const nuevaCantidad = item.cantidad + delta

    if (nuevaCantidad < 1) {
      eliminarProducto(id)
      return
    }

    if (delta > 0) {
      try {
        const producto = buscarProductoActual(id)

        if (nuevaCantidad > producto.stock) {
          notificar(
            `Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`,
            'danger',
          )
          return
        }
      } catch {
        notificar(
          'No se pudo comprobar el stock. Puedes quitar unidades ' +
            'o eliminar el producto, pero no agregar más.',
          'danger',
        )
        return
      }
    }

    persistir(
      carrito.map((producto) =>
        producto.id === id
          ? { ...producto, cantidad: nuevaCantidad }
          : producto,
      ),
      'Cantidad actualizada.',
    )
  }

  function eliminarProducto(id) {
    persistir(
      carrito.filter((item) => item.id !== id),
      'Producto eliminado del carrito.',
    )
  }

  function vaciarCarrito() {
    if (estadoCarrito.error) {
      const confirmado = window.confirm(
        'Esto reemplazará únicamente el carrito guardado por uno vacío. ' +
          'No eliminará usuarios ni productos. ¿Continuar?',
      )

      if (!confirmado) {
        return
      }
    }

    persistir([], 'Carrito vaciado.')
  }

  function irAPagar() {
    if (carrito.length === 0) {
      notificar(
        'Debes agregar productos al carrito antes de continuar.',
        'danger',
      )
      return
    }

    notificar(
      'El pago se habilitará más adelante. Por ahora, tu carrito queda guardado.',
    )
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <h1 className="pagina-titulo h3 mb-1">
              Tienda
            </h1>

            <p
              className="mb-0"
              style={{ color: 'var(--jugoseo-texto-tenue)' }}
            >
              Merch oficial y entradas a eventos de Jugoseo.
            </p>
          </div>

          <button
            type="button"
            className="btn jugoseo-btn-login position-relative"
            onClick={() => setMostrarCarrito(true)}
          >
            🛒 Ver carrito

            {totalUnidades > 0 && (
              <span className="jugoseo-cart-badge">
                {totalUnidades}
              </span>
            )}
          </button>
        </div>

        {aviso && (
          <div
            className={`alert alert-${aviso.tipo}`}
            role="status"
          >
            {aviso.texto}
          </div>
        )}

        {estadoCarrito.error && (
          <div className="alert alert-danger" role="alert">
            {estadoCarrito.error}
          </div>
        )}

        {catalogo.error ? (
          <div className="alert alert-danger" role="alert">
            {catalogo.error}
          </div>
        ) : (
          <>
            {catalogo.omitidos > 0 && (
              <div className="alert alert-warning" role="status">
                Se omitieron {catalogo.omitidos} productos con
                datos inválidos o identificadores repetidos.
              </div>
            )}

            <div className="row g-4">
              {catalogo.productos.length === 0 ? (
                <p className="jugoseo-card-texto text-center py-4">
                  No hay productos disponibles por el momento.
                </p>
              ) : (
                catalogo.productos.map((producto) => (
                  <div
                    className="col-sm-6 col-lg-4 col-xl-3"
                    key={producto.id}
                  >
                    <ProductoCard
                      producto={producto}
                      agregarProducto={agregarProducto}
                      bloqueado={Boolean(estadoCarrito.error)}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <CarritoPanel
          mostrar={mostrarCarrito}
          cerrar={() => setMostrarCarrito(false)}
          items={carrito}
          aviso={aviso}
          errorCarga={estadoCarrito.error}
          cambiarCantidad={cambiarCantidad}
          eliminarProducto={eliminarProducto}
          vaciarCarrito={vaciarCarrito}
          irAPagar={irAPagar}
        />
      </div>
    </section>
  )
}