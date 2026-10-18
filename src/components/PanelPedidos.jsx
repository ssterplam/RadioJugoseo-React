import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  cancelarPedido,
  cambiarEstadoPedido,
  obtenerPedidosAdministrables,
  obtenerSiguienteEstado,
} from '../utils/pedidosStorage.js'

import { formatearCLP } from '../utils/formatoMoneda.js'

const ETIQUETAS_ESTADO = {
  Pendiente: 'warning text-dark',
  'En preparación': 'info text-dark',
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
    const pedidos = obtenerPedidosAdministrables()

    return {
      pedidos: [...pedidos].sort((a, b) => b.id - a.id),
      error: '',
    }
  } catch {
    return {
      pedidos: [],
      error:
        'No se pudo cargar la lista de pedidos. Inténtalo nuevamente.',
    }
  }
}

function mensajeError(error) {
  const mensajes = {
    SESION_REQUERIDA:
      'Debes volver a iniciar sesión.',
    OPERACION_NO_PERMITIDA:
      'No tienes permiso para realizar esta operación.',
    PEDIDO_NO_DISPONIBLE:
      'El pedido ya no está disponible.',
    PEDIDO_CERRADO:
      'El pedido ya está cerrado y no admite cambios.',
    PEDIDO_NO_CANCELABLE:
      'El pedido ya no puede cancelarse. Revisa su estado actual.',
    TRANSICION_INVALIDA:
      'El estado cambió o la transición no es válida. Revisa el pedido.',
    BLOQUEO_NO_DISPONIBLE:
      'No se puede coordinar el almacenamiento. ' +
      'Utiliza localhost o HTTPS en un navegador compatible.',
    DATOS_INVALIDOS:
      'No se pudo completar la operación porque los datos no son válidos.',
  }

  return mensajes[error.codigo] ||
    'No se pudo completar la operación. Inténtalo nuevamente.'
}

export default function PanelPedidos() {
  const [estado, setEstado] = useState(cargarPedidos)
  const [aviso, setAviso] = useState(null)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)
  const [operacion, setOperacion] = useState(null)

  const procesandoRef = useRef(false)

  const recargar = useCallback(() => {
    setEstado(cargarPedidos())
  }, [])

  useEffect(() => {
    function actualizarDesdeOtraPestana(evento) {
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
    window.addEventListener(
      'storage',
      actualizarDesdeOtraPestana,
    )

    return () => {
      window.removeEventListener('focus', recargar)
      window.removeEventListener(
        'storage',
        actualizarDesdeOtraPestana,
      )
    }
  }, [recargar])

  async function avanzarPedido(pedido) {
    if (procesandoRef.current) {
      return
    }

    const siguiente = obtenerSiguienteEstado(pedido.estado)

    if (!siguiente) {
      return
    }

    const confirmado = window.confirm(
      `¿Cambiar el pedido #${pedido.id} de ` +
        `"${pedido.estado}" a "${siguiente}"?`,
    )

    if (!confirmado) {
      return
    }

    procesandoRef.current = true

    setOperacion({
      id: pedido.id,
      tipo: 'avanzar',
    })

    setAviso(null)

    try {
      await cambiarEstadoPedido(pedido.id, siguiente)

      recargar()

      setAviso({
        tipo: 'success',
        texto:
          `El pedido #${pedido.id} cambió a "${siguiente}".`,
      })
    } catch (error) {
      recargar()

      setAviso({
        tipo: 'danger',
        texto: mensajeError(error),
      })
    } finally {
      procesandoRef.current = false
      setOperacion(null)
    }
  }

  async function solicitarCancelacion(pedido) {
    if (procesandoRef.current) {
      return
    }

    const motivo = window.prompt(
      `Cancelar pedido #${pedido.id}. ` +
        'Se devolverán las unidades de los productos ' +
        'que todavía existan en el catálogo. ' +
        'Puedes escribir un motivo o dejarlo vacío.',
    )

    if (motivo === null) {
      return
    }

    procesandoRef.current = true

    setOperacion({
      id: pedido.id,
      tipo: 'cancelar',
    })

    setAviso(null)

    try {
      await cancelarPedido(pedido.id, motivo)

      recargar()

      setAviso({
        tipo: 'success',
        texto:
          `El pedido #${pedido.id} fue cancelado. ` +
          'Se repusieron las unidades de los productos ' +
          'que siguen en el catálogo.',
      })
    } catch (error) {
      recargar()

      setAviso({
        tipo: 'danger',
        texto: mensajeError(error),
      })
    } finally {
      procesandoRef.current = false
      setOperacion(null)
    }
  }

  const procesando = operacion !== null

  return (
    <section className="pagina-interna">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h2 className="pagina-titulo h3 mb-1">
              Gestión de pedidos
            </h2>

            <p className="jugoseo-card-texto mb-0">
              Consulta todos los pedidos, avanza sus estados
              o cancela los que aún no hayan sido entregados.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={recargar}
            disabled={procesando}
          >
            Actualizar
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

        {estado.error ? (
          <div className="alert alert-danger" role="alert">
            {estado.error}
          </div>
        ) : estado.pedidos.length === 0 ? (
          <p className="jugoseo-card-texto text-center py-4">
            No hay pedidos registrados.
          </p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {estado.pedidos.map((pedido) => {
              const siguiente = obtenerSiguienteEstado(
                pedido.estado,
              )

              const cancelable = ESTADOS_CANCELABLES.includes(
                pedido.estado,
              )

              const abierto = pedidoAbierto === pedido.id

              const avanzando =
                operacion?.id === pedido.id &&
                operacion?.tipo === 'avanzar'

              const cancelando =
                operacion?.id === pedido.id &&
                operacion?.tipo === 'cancelar'

              const detalleId =
                `detalle-pedido-admin-${pedido.id}`

              return (
                <article
                  className="jugoseo-card p-3"
                  key={pedido.id}
                >
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div style={{ minWidth: 0 }}>
                      <h3 className="jugoseo-card-titulo h6 mb-1">
                        Pedido #{pedido.id}
                      </h3>

                      <p className="jugoseo-card-texto text-break mb-1">
                        Cliente: {pedido.correoCliente}
                      </p>

                      <p className="jugoseo-card-texto mb-0">
                        Creado:{' '}
                        {formatearFecha(pedido.fechaCreacion)}
                      </p>

                      <p className="jugoseo-card-texto mb-0">
                        Última actualización:{' '}
                        {formatearFecha(pedido.fechaActualizacion)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`badge bg-${
                          ETIQUETAS_ESTADO[pedido.estado] ||
                          'secondary'
                        }`}
                      >
                        {pedido.estado}
                      </span>

                      <p className="jugoseo-card-precio mt-2 mb-0">
                        {formatearCLP(pedido.total)}
                      </p>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      aria-expanded={abierto}
                      aria-controls={detalleId}
                      onClick={() => {
                        setPedidoAbierto(
                          abierto ? null : pedido.id,
                        )
                      }}
                    >
                      {abierto ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>

                    {siguiente && (
                      <button
                        type="button"
                        className="btn btn-sm jugoseo-btn-login"
                        onClick={() => avanzarPedido(pedido)}
                        disabled={procesando}
                        aria-busy={avanzando}
                      >
                        {avanzando
                          ? 'Actualizando…'
                          : `Pasar a ${siguiente}`}
                      </button>
                    )}

                    {cancelable && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          solicitarCancelacion(pedido)
                        }
                        disabled={procesando}
                        aria-busy={cancelando}
                      >
                        {cancelando
                          ? 'Cancelando…'
                          : 'Cancelar pedido'}
                      </button>
                    )}
                  </div>

                  <div id={detalleId} hidden={!abierto}>
                    <div className="table-responsive mt-3">
                      <table className="table jugoseo-tabla-programas align-middle">
                        <thead>
                          <tr>
                            <th scope="col">Artículo</th>
                            <th scope="col">Precio unitario</th>
                            <th scope="col">Cantidad</th>
                            <th scope="col">Subtotal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pedido.articulos.map((articulo) => (
                            <tr key={articulo.id}>
                              <td>{articulo.nombre}</td>

                              <td>
                                {formatearCLP(articulo.precio)}
                              </td>

                              <td>{articulo.cantidad}</td>

                              <td>
                                {formatearCLP(articulo.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pedido.motivoCancelacion && (
                      <p className="jugoseo-card-texto text-break mb-0">
                        Motivo de cancelación:{' '}
                        {pedido.motivoCancelacion}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}