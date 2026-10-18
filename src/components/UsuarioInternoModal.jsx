import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'

import {
  validarUsuarioInterno,
} from '../utils/validacionesUsuario.js'

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    maxLength: 50,
  },
  {
    nombre: 'apellido',
    etiqueta: 'Apellido',
    maxLength: 100,
  },
  {
    nombre: 'correo',
    etiqueta: 'Correo corporativo',
    tipo: 'email',
    maxLength: 100,
    placeholder: 'locutor@jugoseo.com',
  },
  {
    nombre: 'password',
    etiqueta: 'Contraseña',
    tipo: 'password',
    maxLength: 10,
  },
  {
    nombre: 'passwordConfirm',
    etiqueta: 'Confirmar contraseña',
    tipo: 'password',
    maxLength: 10,
  },
]

export default function UsuarioInternoModal({
  usuarios,
  cerrar,
  guardar,
}) {
  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    rol: 'Locutor',
    password: '',
    passwordConfirm: '',
  })

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

    const nuevosErrores = validarUsuarioInterno(
      datos,
      usuarios,
    )

    setErrores(nuevosErrores)
    setErrorGuardado('')

    if (Object.keys(nuevosErrores).length > 0) {
      return
    }

    if (!guardar(datos)) {
      setErrorGuardado(
        'No se pudo crear la cuenta. Revisa los datos e inténtalo nuevamente.',
      )
    }
  }

  return (
    <Modal
      show
      onHide={cerrar}
      centered
      contentClassName="jugoseo-modal"
      aria-labelledby="tituloUsuarioInterno"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          id="tituloUsuarioInterno"
          className="jugoseo-modal-title"
        >
          Crear cuenta interna
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
            const id = `usuario-${campo.nombre}`

            return (
              <div className="mb-3" key={campo.nombre}>
                <label
                  htmlFor={id}
                  className="form-label jugoseo-form-label"
                >
                  {campo.etiqueta}
                </label>

                <input
                  id={id}
                  name={campo.nombre}
                  type={campo.tipo || 'text'}
                  className={`form-control jugoseo-input ${
                    errores[campo.nombre] ? 'is-invalid' : ''
                  }`}
                  value={datos[campo.nombre]}
                  onChange={cambiarCampo}
                  maxLength={campo.maxLength}
                  placeholder={campo.placeholder}
                  autoComplete={
                    campo.tipo === 'password'
                      ? 'new-password'
                      : undefined
                  }
                  aria-invalid={Boolean(errores[campo.nombre])}
                  aria-describedby={`${id}-error`}
                />

                <div
                  id={`${id}-error`}
                  className="invalid-feedback"
                >
                  {errores[campo.nombre]}
                </div>
              </div>
            )
          })}

          <div className="mb-4">
            <label
              htmlFor="usuario-rol"
              className="form-label jugoseo-form-label"
            >
              Rol
            </label>

            <select
              id="usuario-rol"
              name="rol"
              className={`form-select jugoseo-input ${
                errores.rol ? 'is-invalid' : ''
              }`}
              value={datos.rol}
              onChange={cambiarCampo}
              aria-invalid={Boolean(errores.rol)}
              aria-describedby="errorUsuarioRol"
            >
              <option value="Locutor">
                Locutor
              </option>

              <option value="Administrador">
                Administrador
              </option>
            </select>

            <div
              id="errorUsuarioRol"
              className="invalid-feedback"
            >
              {errores.rol}
            </div>
          </div>

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
              Crear cuenta
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  )
}