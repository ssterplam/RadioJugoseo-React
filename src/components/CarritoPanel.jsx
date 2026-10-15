import Offcanvas from 'react-bootstrap/Offcanvas'

import { formatearCLP } from '../utils/formatoMoneda.js'

export default function CarritoPanel({
  mostrar,
  cerrar,
  items,
  aviso,
  errorCarga,
  cambiarCantidad,
  eliminarProducto,
  vaciarCarrito,
  irAPagar,
}) {
  const total = items.reduce(
    (acumulado, item) =>
      acumulado + item.precio * item.cantidad,
    0,
  )

  return (
    <Offcanvas
      show={mostrar}
      onHide={cerrar}
      placement="end"
      className="jugoseo-offcanvas"
      aria-labelledby="tituloCarrito"
    >
      <Offcanvas.Header>
        <Offcanvas.Title
          id="tituloCarrito"
          className="jugoseo-modal-title"
        >
          Tu carrito
        </Offcanvas.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={cerrar}
          aria-label="Cerrar carrito"
        />
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        {aviso && (
          <div
            className={`alert alert-${aviso.tipo}`}
            role="status"
          >
            {aviso.texto}
          </div>
        )}

        {errorCarga && (
          <div className="alert alert-danger" role="alert">
            {errorCarga}
          </div>
        )}

        <div className="flex-grow-1">
          {!errorCarga && items.length === 0 && (
            <p className="jugoseo-card-texto text-center py-4 mb-0">
              Tu carrito está vacío.
            </p>
          )}

          {items.map((item) => (
            <div
              className="jugoseo-carrito-item"
              key={item.id}
            >
              <div className="jugoseo-card-titulo">
                {item.nombre}
              </div>

              <div className="jugoseo-card-texto">
                {formatearCLP(item.precio)} c/u
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="jugoseo-btn-qty"
                    onClick={() => cambiarCantidad(item.id, -1)}
                    aria-label={`Restar una unidad de ${item.nombre}`}
                  >
                    −
                  </button>

                  <span className="jugoseo-qty-valor">
                    {item.cantidad}
                  </span>

                  <button
                    type="button"
                    className="jugoseo-btn-qty"
                    onClick={() => cambiarCantidad(item.id, 1)}
                    aria-label={`Sumar una unidad de ${item.nombre}`}
                  >
                    +
                  </button>
                </div>

                <span className="jugoseo-card-precio">
                  {formatearCLP(item.precio * item.cantidad)}
                </span>

                <button
                  type="button"
                  className="jugoseo-btn-eliminar"
                  onClick={() => eliminarProducto(item.id)}
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="jugoseo-carrito-resumen mt-3 pt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="jugoseo-card-titulo">
              Total
            </span>

            <span className="jugoseo-card-precio fs-5">
              {formatearCLP(total)}
            </span>
          </div>

          <button
            type="button"
            className="btn jugoseo-btn-login w-100 mb-2"
            onClick={irAPagar}
            disabled={Boolean(errorCarga)}
          >
            Ir a pagar
          </button>

          <button
            type="button"
            className="btn btn-outline-light w-100"
            onClick={vaciarCarrito}
            disabled={!errorCarga && items.length === 0}
          >
            {errorCarga ? 'Reiniciar carrito guardado' : 'Vaciar carrito'}
          </button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  )
}