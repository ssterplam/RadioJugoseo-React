import { useState } from 'react'

import ProductoModal from './ProductoModal.jsx'

import {
  actualizarProducto,
  crearProducto,
  eliminarProductoAdministrativo,
  obtenerProductosAdministrables,
} from '../utils/productosStorage.js'

import { formatearCLP } from '../utils/formatoMoneda.js'

function cargarPanel() {
  try {
    return {
      productos: obtenerProductosAdministrables(),
      error: '',
    }
  } catch {
    return {
      productos: [],
      error:
        'No se pudo cargar esta sección. Inténtalo nuevamente.',
    }
  }
}

function productoVacio() {
  return {
    id: null,
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: '',
    stock: '',
    imagen: '',
  }
}

export default function PanelProductos() {
  const [estado, setEstado] = useState(cargarPanel)
  const [productoEditando, setProductoEditando] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function guardar(datos) {
    if (!productoEditando) {
      return false
    }

    const creando = productoEditando.id === null

    try {
      const actualizados = creando
        ? await crearProducto(datos)
        : await actualizarProducto(
            productoEditando.id,
            datos,
            productoEditando,
          )

      setEstado({
        productos: actualizados,
        error: '',
      })

      setProductoEditando(null)

      setAviso({
        tipo: 'success',
        texto: creando
          ? 'Producto creado.'
          : 'Producto actualizado.',
      })

      return true
    } catch {
      setEstado(cargarPanel())

      return false
    }
  }

  async function solicitarEliminacion(producto) {
    const confirmado = window.confirm(
      `¿Eliminar "${producto.nombre}" del catálogo? ` +
        'Esta acción no se puede deshacer desde la aplicación.',
    )

    if (!confirmado) {
      return
    }

    try {
      const actualizados = await eliminarProductoAdministrativo(
        producto.id,
      )

      setEstado({
        productos: actualizados,
        error: '',
      })

      setAviso({
        tipo: 'success',
        texto: 'Producto eliminado.',
      })
    } catch (error) {
      setEstado(cargarPanel())

      const mensajes = {
        PRODUCTO_EN_CARRITO:
          'Quita primero este producto del carrito guardado ' +
          'antes de eliminarlo del catálogo.',
        BLOQUEO_NO_DISPONIBLE:
          'No se puede coordinar el almacenamiento. ' +
          'Utiliza localhost o HTTPS en un navegador compatible.',
      }

      setAviso({
        tipo: 'danger',
        texto: mensajes[error.codigo] ||
          'No se pudo eliminar el producto. Inténtalo nuevamente.',
      })
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <h2 className="pagina-titulo h3 mb-0">
            Gestión de productos
          </h2>

          <button
            type="button"
            className="btn jugoseo-btn-login"
            disabled={Boolean(estado.error)}
            onClick={() => {
              setAviso(null)
              setProductoEditando(productoVacio())
            }}
          >
            Crear producto
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
        ) : estado.productos.length === 0 ? (
          <p className="jugoseo-card-texto">
            No hay productos disponibles.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table jugoseo-tabla-programas align-middle">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {estado.productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria}</td>
                    <td>
                      {formatearCLP(producto.precio)}
                    </td>

                    <td>
                      {producto.stock <= 5 ? (
                        <span className="badge bg-danger">
                          {producto.stock}
                          {producto.stock === 0
                            ? ' · Agotado'
                            : ' · Stock bajo'}
                        </span>
                      ) : (
                        producto.stock
                      )}
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-light"
                          onClick={() => {
                            setAviso(null)
                            setProductoEditando(producto)
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            solicitarEliminacion(producto)
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {productoEditando && (
          <ProductoModal
            key={productoEditando.id || 'nuevo-producto'}
            producto={productoEditando}
            productos={estado.productos}
            cerrar={() => setProductoEditando(null)}
            guardar={guardar}
          />
        )}
      </div>
    </section>
  )
}