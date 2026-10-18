import { useCallback, useEffect, useState } from 'react'

import {
  cancelarPedido,
  obtenerPedidosPropios,
} from '../utils/pedidosStorage.js'

import { formatearCLP } from '../utils/formatoMoneda.js'

const ETIQUETAS_ESTADO = {
  Pendiente: 'warning',
  'En preparación': 'info',
  Enviado: 'primary',
  Entregado: 'success',
  Cancelado: 'danger',
}

const ESTADOS_CANCELABLES = [
  'Pendiente',
  'En preparación',
  'Enviado',
]

function formatearFecha(valor) {
  if (!valor) {
    return '—'
  }

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return '—'
  }

  return fecha.toLocaleString('es-CL')
}

function cargarPedidos() {
  try {
    return {
      pedidos: obtenerPedidosPropios(),
      error: '',
    }
  } catch {
    return {
      pedidos: [],
      error:
        'No se pudo cargar tu historial. Inténtalo nuevamente.',
    }
  }
}

export default function HistorialPedidos() {
  const [estado, setEstado] = useState(cargarPedidos)
  const [aviso, setAviso] = useState(null)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  const recargar = useCallback(() => {
    setEstado(cargarPedidos())
  }, [])

  useEffect(() => {
    function actualizar(evento) {
      if (
        evento.key === 'jugoseoComercio' ||
        evento.key === 'jugoseoPedidos' ||
        evento.key === 'jugoseoProductos' ||
        evento.key === null
      ) {
        recargar()
      }
    }

    window.addEventListener('focus', recargar)
    window.addEventListener('storage', actualizar)

    return () => {
      window.removeEventListener('focus', recargar)
      window.removeEventListener('storage', actualizar)
    }
  }, [recargar])

  function solicitarCancelacion(pedido) {
    const motivo = window.prompt(
      `¿Por qué deseas cancelar el pedido #${pedido.id}? ` +
        'Puedes dejar el motivo vacío.',
    )

    if (motivo === null) {
      return
    }

    try {
      cancelarPedido(pedido.id, motivo)

      recargar()
      setAviso({
        tipo: 'success',
        texto: `El pedido #${pedido.id} fue cancelado. El stock fue devuelto al catálogo.`,
      })
    } catch (error) {
      setAviso({
        tipo: 'danger',
        texto: error.message ||
          'No se pudo cancelar el pedido. Inténtalo nuevamente.',
      })
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3 mb-1">
          Mis pedidos
        </h1>

        <p className="jugoseo-card-texto mb-4">
          Revisa el estado de tus compras y cancela los pedidos
          que aún no hayan sido entregados.
        </p>

        {aviso && (
          <div
            className={`alert alert-${aviso.tipo}`}
            role="status"
          >
            {aviso.texto}
          </div>
        )}

        {estado.error ? (
          <div className="alert alert-danger" role="alert">
            {estado.error}
          </div>
        ) : estado.pedidos.length === 0 ? (
          <div className="jugoseo-card-texto text-center py-4">
            Todavía no tienes pedidos registrados.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {estado.pedidos.map((pedido) => {
              const cancelable = ESTADOS_CANCELABLES.includes(
                pedido.estado,
              )

              const abierto = pedidoAbierto === pedido.id

              return (
                <article
                  className="jugoseo-card p-3"
                  key={pedido.id}
                >
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <h2 className="jugoseo-card-titulo h6 mb-1">
                        Pedido #{pedido.id}
                      </h2>

                      <p className="jugoseo-card-texto mb-0">
                        Creado: {formatearFecha(pedido.fechaCreacion)}
                      </p>

                      <p className="jugoseo-card-texto mb-0">
                        Última actualización:{' '}
                        {formatearFecha(pedido.fechaActualizacion)}
                      </p>
                    </div>

                    <div className="text-end">
                      <span
                        className={`badge bg-${ETIQUETAS_ESTADO[pedido.estado] || 'secondary'}`}
                      >
                        {pedido.estado}
                      </span>

                      <p className="jugoseo-card-precio mb-0 mt-2">
                        {formatearCLP(pedido.total)}
                      </p>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={() =>
                        setPedidoAbierto(
                          abierto ? null : pedido.id,
                        )
                      }
                      aria-expanded={abierto}
                    >
                      {abierto ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>

                    {cancelable && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          solicitarCancelacion(pedido)
                        }
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>

                  {abierto && (
                    <div className="mt-3">
                      <ul className="list-unstyled mb-2">
                        {pedido.articulos.map((articulo) => (
                          <li
                            key={`${pedido.id}-${articulo.id}`}
                            className="d-flex justify-content-between gap-3 mb-1"
                          >
                            <span>
                              {articulo.nombre} ×{' '}
                              {articulo.cantidad}
                            </span>

                            <span className="jugoseo-card-precio">
                              {formatearCLP(articulo.subtotal)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {pedido.motivoCancelacion && (
                        <p className="jugoseo-card-texto mb-0">
                          Motivo de cancelación:{' '}
                          {pedido.motivoCancelacion}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}