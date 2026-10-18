import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'

import {
  validarEdicionPrograma,
} from '../utils/validacionesPrograma.js'

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre del programa',
    maxLength: 100,
  },
  {
    nombre: 'conductor',
    etiqueta: 'Conductor o nombre artístico',
    maxLength: 100,
  },
  {
    nombre: 'imagen',
    etiqueta: 'Archivo de imagen',
    maxLength: 150,
    ayuda: 'Nombre del archivo existente en public/img, por ejemplo DandoJugo.png.',
  },
  {
    nombre: 'horarioDetalle',
    etiqueta: 'Horario',
    maxLength: 150,
  },
  {
    nombre: 'descripcion',
    etiqueta: 'Descripción del catálogo',
    multilinea: true,
    rows: 3,
    maxLength: 500,
  },
  {
    nombre: 'parrafos',
    etiqueta: 'Contenido de la ficha',
    multilinea: true,
    rows: 6,
    maxLength: 10000,
    ayuda: 'Escribe un párrafo por línea.',
  },
  {
    nombre: 'caracteristicas',
    etiqueta: 'Lo que puedes esperar',
    multilinea: true,
    rows: 4,
    maxLength: 10000,
    ayuda: 'Escribe una característica por línea.',
  },
]

export default function EditarProgramaModal({
  programa,
  esAdministrador,
  cerrar,
  guardar,
}) {
  const [datos, setDatos] = useState(() => ({
    nombre: programa.nombre,
    conductor: programa.conductor,
    imagen: programa.imagen,
    horarioDetalle: programa.horarioDetalle,
    descripcion: programa.descripcion,
    parrafos: programa.parrafos.join('\n'),
    caracteristicas: programa.caracteristicas.join('\n'),
  }))

  const [errores, setErrores] = useState({})
  const [errorGuardado, setErrorGuardado] = useState('')

  function cambiarCampo(evento) {
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

  function enviar(evento) {
    evento.preventDefault()

    const nuevosErrores = validarEdicionPrograma(
      datos,
      esAdministrador,
    )

    setErrores(nuevosErrores)
    setErrorGuardado('')

    if (Object.keys(nuevosErrores).length > 0) {
      return
    }

    const guardado = guardar(datos)

    if (!guardado) {
      setErrorGuardado(
        'No se pudo guardar el cambio. Inténtalo nuevamente.',
      )
    }
  }

  return (
    <Modal
      show
      onHide={cerrar}
      centered
      size="lg"
      contentClassName="jugoseo-modal"
      aria-labelledby="tituloEditarPrograma"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          id="tituloEditarPrograma"
          className="jugoseo-modal-title"
        >
          Editar programa
        </Modal.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={cerrar}
          aria-label="Cerrar"
        />
      </Modal.Header>

      <Modal.Body>
        {errorGuardado && (
          <div className="alert alert-danger" role="alert">
            {errorGuardado}
          </div>
        )}

        <form onSubmit={enviar} noValidate>
          {campos.map((campo) => {
            const id = `editar-programa-${campo.nombre}`

            const propiedades = {
              id,
              name: campo.nombre,
              value: datos[campo.nombre],
              onChange: cambiarCampo,
              maxLength: campo.maxLength,
              readOnly:
                !esAdministrador &&
                ['nombre', 'conductor', 'horarioDetalle'].includes(
                    campo.nombre,
                ),
              className:
                `form-control jugoseo-input ${
                  errores[campo.nombre] ? 'is-invalid' : ''
                }`,
              'aria-invalid': Boolean(errores[campo.nombre]),
              'aria-describedby': `${id}-ayuda ${id}-error`,
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
                    rows={campo.rows}
                  />
                ) : (
                  <input
                    {...propiedades}
                    type="text"
                  />
                )}

                <div
                  id={`${id}-ayuda`}
                  className="jugoseo-card-texto mt-1"
                >
                  {campo.ayuda}
                </div>

                <div
                  id={`${id}-error`}
                  className="invalid-feedback"
                >
                  {errores[campo.nombre]}
                </div>
              </div>
            )
          })}

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={cerrar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn jugoseo-btn-login"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  )
}