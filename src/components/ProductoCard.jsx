import { useState } from 'react'

import { formatearCLP } from '../utils/formatoMoneda.js'

export default function ProductoCard({ producto }) {
  const [imagenFallida, setImagenFallida] = useState(false)

  const agotado = producto.stock === 0
  const pocasUnidades =
    producto.stock > 0 && producto.stock <= 5

  const rutaImagen =
    `${import.meta.env.BASE_URL}${producto.imagen.replace(/^\/+/, '')}`

  return (
    <article className="jugoseo-card d-flex flex-column h-100">
      {imagenFallida ? (
        <div className="jugoseo-card-img d-flex align-items-center justify-content-center">
          <span className="jugoseo-card-texto">
            Imagen no disponible
          </span>
        </div>
      ) : (
        <img
          src={rutaImagen}
          alt={producto.nombre}
          className="jugoseo-card-img"
          loading="lazy"
          onError={() => setImagenFallida(true)}
        />
      )}

      <span className="jugoseo-badge mb-2 d-inline-block">
        {producto.categoria}
      </span>

      <h2 className="jugoseo-card-titulo">
        {producto.nombre}
      </h2>

      <p className="jugoseo-card-texto mb-1">
        {agotado ? (
          <span className="text-danger fw-semibold">
            Agotado
          </span>
        ) : (
          <>
            Stock: {producto.stock}
            {pocasUnidades && ' · ¡últimas unidades!'}
          </>
        )}
      </p>

      <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
        <span className="jugoseo-card-precio">
          {formatearCLP(producto.precio)}
        </span>
      </div>

      <div className="d-flex gap-2 mt-auto">
        <input
          type="number"
          className="form-control jugoseo-input jugoseo-qty-input"
          value={agotado ? 0 : 1}
          disabled
          aria-label={`Cantidad de ${producto.nombre}`}
        />

        <button
          type="button"
          className="btn jugoseo-btn-login flex-grow-1"
          disabled
        >
          {agotado ? 'Sin stock' : 'Agregar'}
        </button>
      </div>
    </article>
  )
}