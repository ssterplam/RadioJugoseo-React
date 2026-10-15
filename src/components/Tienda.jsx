import { useState } from 'react'

import ProductoCard from './ProductoCard.jsx'

import {
  esProductoValido,
  obtenerProductos,
} from '../utils/productosStorage.js'

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

export default function Tienda() {
  const [catalogo] = useState(cargarCatalogo)

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
            disabled
          >
            🛒 Ver carrito
          </button>
        </div>

        <p className="jugoseo-card-texto mb-4">
          Catálogo disponible. La selección de cantidades y el
          carrito se habilitarán en el siguiente bloque de migración.
        </p>

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
                    <ProductoCard producto={producto} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}