import { useRef, useState } from 'react'

import Modal from 'react-bootstrap/Modal'

import { CATEGORIAS_VALIDAS } from '../data/productos.js'
import { validarProducto } from '../utils/validacionesProducto.js'

const campos = [
  {
    nombre: 'codigo',
    etiqueta: 'Código',
    maxLength: 30,
  },
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    maxLength: 100,
  },
  {
    nombre: 'descripcion',
    etiqueta: 'Descripción (opcional)',
    multilinea: true,
    maxLength: 500,
  },
  {
    nombre: 'precio',
    etiqueta: 'Precio en pesos chilenos',
    tipo: 'number',
  },
  {
    nombre: 'stock',
    etiqueta: 'Stock',
    tipo: 'number',
  },
  {
    nombre: 'imagen',
    etiqueta: 'Archivo de imagen',
    maxLength: 150,
  },
]

export default function ProductoModal({
  producto,
  productos,
  cerrar,
  guardar,
}) {
  const esNuevo = producto.id === null

  const [datos, setDatos] = useState(() => ({
    codigo: producto.codigo || '',
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    categoria: producto.categoria || '',
    precio: String(producto.precio ?? ''),
    stock: String(producto.stock ?? ''),
    imagen: (producto.imagen || '').replace(/^img\//, ''),
  }))

  const [errores, setErrores] = useState({})
  const [errorGuardado, setErrorGuardado] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardandoRef = useRef(false)

  function solicitarCierre() {
    if (guardandoRef.current) {
      return
    }

    cerrar()
  }

  function cambiarCampo(evento) {
    if (guardandoRef.current) {
      return
    }

    const { name, value } = evento.target

    setDatos((actual) => ({
      ...actual,
      [name]: value,
    }))

    setErrores((actual) => ({
      ...actual,
      [name]: '',
    }))

    setErrorGuardado('')
  }

  async function enviar(evento) {
    evento.preventDefault()

    if (guardandoRef.current) {
      return
    }

    const nuevosErrores = validarProducto(
      datos,
      productos,
      producto.id,
    )

    setErrores(nuevosErrores)
    setErrorGuardado('')

    if (Object.keys(nuevosErrores).length > 0) {
      return
    }

    guardandoRef.current = true
    setGuardando(true)

    try {
      const guardado = await guardar(datos)

      if (!guardado) {
        setErrorGuardado(
          'No se pudo guardar el producto. Revisa los datos. ' +
            'Si cambió el catálogo, cierra este formulario ' +
            'y vuelve a abrirlo para cargar la versión actual.',
        )
      }
    } catch {
      setErrorGuardado(
        'No se pudo guardar el producto. Inténtalo nuevamente.',
      )
    } finally {
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  return (
    <Modal
      show
      onHide={solicitarCierre}
      centered
      size="lg"
      contentClassName="jugoseo-modal"
      aria-labelledby="tituloProductoModal"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          id="tituloProductoModal"
          className="jugoseo-modal-title"
        >
          {esNuevo ? 'Crear producto' : 'Editar producto'}
        </Modal.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={solicitarCierre}
          aria-label="Cerrar"
          disabled={guardando}
        />
      </Modal.Header>

      <Modal.Body>
        {errorGuardado && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {errorGuardado}
          </div>
        )}

        <form
          onSubmit={enviar}
          noValidate
          aria-busy={guardando}
        >
          {campos.map((campo) => {
            const id = `producto-${campo.nombre}`

            const propiedades = {
              id,
              name: campo.nombre,
              value: datos[campo.nombre],
              onChange: cambiarCampo,
              maxLength: campo.maxLength,
              disabled: guardando,
              className:
                `form-control jugoseo-input ${
                  errores[campo.nombre] ? 'is-invalid' : ''
                }`,
              'aria-invalid': Boolean(errores[campo.nombre]),
              'aria-describedby': `${id}-error`,
            }

            return (
              <div className="mb-3" key={campo.nombre}>
                <label
                  htmlFor={id}
                  className="form-label jugoseo-form-label"
                >
                  {campo.etiqueta}
                </label>

                {campo.multilinea ? (
                  <textarea
                    {...propiedades}
                    rows={3}
                  />
                ) : (
                  <input
                    {...propiedades}
                    type={campo.tipo || 'text'}
                    min={campo.tipo === 'number' ? 0 : undefined}
                    step={campo.tipo === 'number' ? 1 : undefined}
                  />
                )}

                <div
                  id={`${id}-error`}
                  className="invalid-feedback"
                >
                  {errores[campo.nombre]}
                </div>

                {campo.nombre === 'imagen' && (
                  <p className="jugoseo-card-texto mt-1 mb-0">
                    Nombre del archivo existente en public/img,
                    por ejemplo polera1.jpg.
                  </p>
                )}
              </div>
            )
          })}

          <div className="mb-4">
            <label
              htmlFor="producto-categoria"
              className="form-label jugoseo-form-label"
            >
              Categoría
            </label>

            <select
              id="producto-categoria"
              name="categoria"
              className={`form-select jugoseo-input ${
                errores.categoria ? 'is-invalid' : ''
              }`}
              value={datos.categoria}
              onChange={cambiarCampo}
              disabled={guardando}
              aria-invalid={Boolean(errores.categoria)}
              aria-describedby="errorProductoCategoria"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>

              {CATEGORIAS_VALIDAS.map((categoria) => (
                <option
                  value={categoria}
                  key={categoria}
                >
                  {categoria}
                </option>
              ))}
            </select>

            <div
              id="errorProductoCategoria"
              className="invalid-feedback"
            >
              {errores.categoria}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={solicitarCierre}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn jugoseo-btn-login"
              disabled={guardando}
              aria-busy={guardando}
            >
              {guardando
                ? 'Guardando…'
                : esNuevo
                  ? 'Crear producto'
                  : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  )
}