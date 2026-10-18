import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import ProductoCard from './ProductoCard.jsx'
import CarritoPanel from './CarritoPanel.jsx'
import ConfirmarPedidoModal from './ConfirmarPedidoModal.jsx'

import {
  guardarCarrito,
} from '../utils/carritoStorage.js'

import {
  conBloqueoComercio,
} from '../utils/comercioStorage.js'

import {
  leerEstadoTienda,
  reconciliarCarrito,
} from '../utils/sincronizarCarrito.js'

import {
  confirmarPedido,
  obtenerResumenPedido,
} from '../utils/pedidosStorage.js'

function rechazarOperacion(mensaje) {
  const error = new Error(mensaje)
  error.esAvisoTienda = true
  throw error
}

export default function Tienda() {
  const [estado, setEstado] = useState(leerEstadoTienda)
  const [mostrarCarrito, setMostrarCarrito] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [resumenPedido, setResumenPedido] = useState(null)

  const aplicarEstado = useCallback((nuevoEstado) => {
    setEstado((anterior) => ({
      ...nuevoEstado,
      cambios: [
        ...new Set([
          ...anterior.cambios,
          ...nuevoEstado.cambios,
        ]),
      ],
    }))
  }, [])

  const sincronizar = useCallback(() => {
    const siguiente = leerEstadoTienda()

    aplicarEstado(siguiente)

    return siguiente
  }, [aplicarEstado])

  useEffect(() => {
    function actualizarDesdeOtraPestana(evento) {
      if (
        evento.key === 'jugoseoComercio' ||
        evento.key === 'jugoseoProductos' ||
        evento.key === 'jugoseoCarrito' ||
        evento.key === null
      ) {
        sincronizar()
      }
    }

    window.addEventListener('focus', sincronizar)
    window.addEventListener(
      'storage',
      actualizarDesdeOtraPestana,
    )

    return () => {
      window.removeEventListener('focus', sincronizar)
      window.removeEventListener(
        'storage',
        actualizarDesdeOtraPestana,
      )
    }
  }, [sincronizar])

  const carrito = estado.items

  const totalUnidades = carrito.reduce(
    (total, item) => total + item.cantidad,
    0,
  )

  const errorCarga =
    estado.errorCatalogo || estado.errorCarrito

  function notificar(texto, tipo = 'info') {
    setAviso({ texto, tipo })
  }

  async function ejecutarOperacion(transformar, mensaje) {
    try {
      await conBloqueoComercio(() => {
        const base = leerEstadoTienda()

        if (base.errorCatalogo || base.errorCarrito) {
          rechazarOperacion(
            'No se pudo comprobar el carrito. Inténtalo nuevamente.',
          )
        }

        const nuevosItems = transformar(base)

        const resultado = reconciliarCarrito(
          nuevosItems,
          base.productos,
        )

        guardarCarrito(resultado.items)
      })

      sincronizar()
      notificar(mensaje, 'success')

      return true
    } catch (error) {
      sincronizar()

      notificar(
        error.esAvisoTienda ||
        error.codigo === 'BLOQUEO_NO_DISPONIBLE'
          ? error.message
          : 'No se pudo guardar el cambio. Inténtalo nuevamente.',
        'danger',
      )

      return false
    }
  }

  function agregarProducto(id, cantidad) {
    return ejecutarOperacion((base) => {
      if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
        rechazarOperacion(
          'Ingresa una cantidad entera mayor o igual a 1.',
        )
      }

      const producto = base.productos.find(
        (item) => item.id === id,
      )

      if (!producto) {
        rechazarOperacion('El producto no está disponible.')
      }

      const existente = base.items.find(
        (item) => item.id === id,
      )

      const nuevaCantidad =
        (existente?.cantidad || 0) + cantidad

      if (
        !Number.isSafeInteger(nuevaCantidad) ||
        nuevaCantidad > producto.stock
      ) {
        rechazarOperacion(
          `Hay ${producto.stock} unidades disponibles de "${producto.nombre}".`,
        )
      }

      if (existente) {
        return base.items.map((item) =>
          item.id === id
            ? {
                ...item,
                cantidad: nuevaCantidad,
              }
            : item,
        )
      }

      return [
        ...base.items,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad,
        },
      ]
    }, 'Producto agregado al carrito.')
  }

  function cambiarCantidad(id, delta) {
    return ejecutarOperacion((base) => {
      if (![1, -1].includes(delta)) {
        rechazarOperacion('Operación no válida.')
      }

      const item = base.items.find(
        (producto) => producto.id === id,
      )

      if (!item) {
        rechazarOperacion(
          'El artículo ya no está en el carrito.',
        )
      }

      const nuevaCantidad = item.cantidad + delta

      if (nuevaCantidad < 1) {
        return base.items.filter(
          (producto) => producto.id !== id,
        )
      }

      if (delta > 0) {
        const producto = base.productos.find(
          (productoActual) => productoActual.id === id,
        )

        if (
          !producto ||
          !Number.isSafeInteger(nuevaCantidad) ||
          nuevaCantidad > producto.stock
        ) {
          rechazarOperacion(
            'No hay disponibilidad para aumentar la cantidad.',
          )
        }
      }

      return base.items.map((producto) =>
        producto.id === id
          ? {
              ...producto,
              cantidad: nuevaCantidad,
            }
          : producto,
      )
    }, 'Cantidad actualizada.')
  }

  function eliminarProducto(id) {
    return ejecutarOperacion(
      (base) =>
        base.items.filter((item) => item.id !== id),
      'Producto eliminado del carrito.',
    )
  }

  async function vaciarCarrito() {
    if (
      estado.errorCarrito &&
      !window.confirm(
        '¿Reiniciar únicamente el carrito guardado? ' +
          'No se eliminarán usuarios ni productos.',
      )
    ) {
      return
    }

    try {
      await conBloqueoComercio(() => {
        guardarCarrito([])
      })

      sincronizar()
      notificar('Carrito vaciado.', 'success')
    } catch (error) {
      sincronizar()

      notificar(
        error.codigo === 'BLOQUEO_NO_DISPONIBLE'
          ? error.message
          : 'No se pudo vaciar el carrito. Inténtalo nuevamente.',
        'danger',
      )
    }
  }

  function abrirCarrito() {
    sincronizar()
    setMostrarCarrito(true)
  }

  function mensajeErrorPedido(error) {
    const mensajes = {
      SESION_REQUERIDA:
        'Debes volver a iniciar sesión.',
      CARRITO_VACIO:
        'Agrega productos al carrito antes de continuar.',
      PRODUCTO_NO_DISPONIBLE:
        'Un producto ya no está disponible. Revisa el carrito.',
      STOCK_INSUFICIENTE:
        'Cambió la disponibilidad. Revisa las cantidades del carrito.',
      RESUMEN_CAMBIADO:
        'El carrito, sus precios o la cuenta cambiaron. ' +
        'Revisa los artículos y vuelve a abrir la confirmación.',
      DATOS_INVALIDOS:
        'No se pudo preparar el pedido. Revisa el carrito.',
      BLOQUEO_NO_DISPONIBLE:
        'No se puede coordinar el almacenamiento. ' +
        'Utiliza localhost o HTTPS en un navegador compatible.',
    }

    return mensajes[error.codigo] ||
      'No se pudo completar el pedido. Inténtalo nuevamente.'
  }

  function irAPagar() {
    const actual = sincronizar()

    if (actual.errorCatalogo || actual.errorCarrito) {
      notificar(
        'No se pudo comprobar el carrito. Inténtalo nuevamente.',
        'danger',
      )
      return
    }

    if (Object.keys(actual.conflictos).length > 0) {
      notificar(
        'Revisa los artículos no disponibles o sus cantidades.',
        'danger',
      )
      return
    }

    try {
      const resumen = obtenerResumenPedido()

      setAviso(null)
      setMostrarCarrito(false)
      setResumenPedido(resumen)
    } catch (error) {
      notificar(mensajeErrorPedido(error), 'danger')
    }
  }

  async function confirmarCompra() {
    try {
      const pedido = await confirmarPedido(resumenPedido)

      setResumenPedido(null)
      setMostrarCarrito(false)
      sincronizar()

      notificar(
        `Pedido #${pedido.id} creado. Quedó en estado Pendiente.`,
        'success',
      )

      return { ok: true }
    } catch (error) {
      const mensaje = mensajeErrorPedido(error)

      setResumenPedido(null)
      setMostrarCarrito(true)
      sincronizar()

      notificar(
        mensaje,
        error.codigo === 'RESUMEN_CAMBIADO'
          ? 'warning'
          : 'danger',
      )

      return {
        ok: false,
        mensaje,
      }
    }
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
            onClick={abrirCarrito}
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

        {estado.cambios.length > 0 && (
          <div className="alert alert-warning" role="status">
            <p className="mb-2">
              Se detectaron cambios en los artículos del carrito:
            </p>

            <ul className="mb-0">
              {estado.cambios.map((cambio) => (
                <li key={cambio}>{cambio}</li>
              ))}
            </ul>
          </div>
        )}

        {errorCarga && (
          <div className="alert alert-danger" role="alert">
            {errorCarga}
          </div>
        )}

        {estado.errorCatalogo ? (
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => sincronizar()}
          >
            Reintentar
          </button>
        ) : (
          <div className="row g-4">
            {estado.productos.length === 0 ? (
              <p className="jugoseo-card-texto text-center py-4">
                No hay productos disponibles por el momento.
              </p>
            ) : (
              estado.productos.map((producto) => (
                <div
                  className="col-sm-6 col-lg-4 col-xl-3"
                  key={producto.id}
                >
                  <ProductoCard
                    key={`${producto.id}-${producto.imagen}`}
                    producto={producto}
                    agregarProducto={agregarProducto}
                    bloqueado={Boolean(errorCarga)}
                  />
                </div>
              ))
            )}
          </div>
        )}

        <CarritoPanel
          mostrar={mostrarCarrito}
          cerrar={() => setMostrarCarrito(false)}
          items={carrito}
          conflictos={estado.conflictos}
          cambios={estado.cambios}
          aviso={aviso}
          errorCarga={errorCarga}
          cambiarCantidad={cambiarCantidad}
          eliminarProducto={eliminarProducto}
          vaciarCarrito={vaciarCarrito}
          irAPagar={irAPagar}
        />

        {resumenPedido && (
          <ConfirmarPedidoModal
            items={resumenPedido.articulos}
            cerrar={() => setResumenPedido(null)}
            confirmar={confirmarCompra}
          />
        )}
      </div>
    </section>
  )
}