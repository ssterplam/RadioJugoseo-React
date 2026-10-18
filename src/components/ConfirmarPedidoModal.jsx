import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'

import { formatearCLP } from '../utils/formatoMoneda.js'

export default function ConfirmarPedidoModal({
  items,
  cerrar,
  confirmar,
}) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const total = items.reduce(
    (acumulado, item) =>
      acumulado + item.precio * item.cantidad,
    0,
  )

  function enviar() {
    setGuardando(true)
    setError('')

    const resultado = confirmar()

    if (!resultado.ok) {
      setError(resultado.mensaje)
      setGuardando(false)
    }
  }

  return (
    <Modal
      show
      onHide={cerrar}
      centered
      contentClassName="jugoseo-modal"
      aria-labelledby="tituloConfirmarPedido"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          id="tituloConfirmarPedido"
          className="jugoseo-modal-title"
        >
          Confirmar pedido
        </Modal.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={cerrar}
          aria-label="Cerrar"
          disabled={guardando}
        />
      </Modal.Header>

      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <p className="jugoseo-card-texto">
          Revisa los artículos antes de confirmar. Al continuar,
          se descontará el stock disponible y tu carrito se vaciará.
        </p>

        <ul className="list-unstyled mb-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="d-flex justify-content-between gap-3 mb-2"
            >
              <span>
                {item.nombre} × {item.cantidad}
              </span>

              <span className="jugoseo-card-precio">
                {formatearCLP(item.precio * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <div className="d-flex justify-content-between jugoseo-card-precio fs-5 mb-4">
          <span>Total</span>
          <span>{formatearCLP(total)}</span>
        </div>

        <p className="jugoseo-card-texto">
          Esta versión no realiza pagos reales. El pedido quedará
          registrado como <strong>Pendiente</strong>.
        </p>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={cerrar}
            disabled={guardando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn jugoseo-btn-login"
            onClick={enviar}
            disabled={guardando}
          >
            Confirmar pedido
          </button>
        </div>
      </Modal.Body>
    </Modal>
  )
}