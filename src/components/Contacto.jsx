import { useState } from 'react'

import {
  MAX_CARACTERES_CORREO,
  MAX_CARACTERES_MENSAJE,
  MAX_CARACTERES_NOMBRE,
  validarContacto,
} from '../utils/validacionesContacto.js'

const valoresIniciales = {
  nombre: '',
  correo: '',
  mensaje: '',
}

export default function Contacto() {
  const [datos, setDatos] = useState({ ...valoresIniciales })
  const [errores, setErrores] = useState({})
  const [tocados, setTocados] = useState({})
  const [aviso, setAviso] = useState('')
  const [exito, setExito] = useState(false)

  const caracteresMensaje = datos.mensaje.length

  function cambiarCampo(evento) {
    const { name, value } = evento.target

    const nuevosDatos = {
      ...datos,
      [name]: value,
    }

    setDatos(nuevosDatos)
    setErrores(validarContacto(nuevosDatos))
    setAviso('')
    setExito(false)
  }

  function marcarTocado(evento) {
    const { name } = evento.target

    setTocados((actual) => ({
      ...actual,
      [name]: true,
    }))

    setErrores(validarContacto(datos))
  }

  function claseCampo(nombre) {
    if (!tocados[nombre]) {
      return ''
    }

    return errores[nombre] ? 'is-invalid' : 'is-valid'
  }

  function enviarMensaje(evento) {
    evento.preventDefault()

    const nuevosErrores = validarContacto(datos)

    setErrores(nuevosErrores)
    setTocados({
      nombre: true,
      correo: true,
      mensaje: true,
    })
    setExito(false)

    if (Object.keys(nuevosErrores).length > 0) {
      setAviso(
        'Revisa los campos marcados en rojo antes de enviar.',
      )
      return
    }

    const nombre = datos.nombre.trim()

    setExito(true)
    setAviso(
      `¡Gracias, ${nombre}! El formulario se validó correctamente. ` +
        'Esta versión simula el envío; no se envió un correo real.',
    )

    setDatos({ ...valoresIniciales })
    setErrores({})
    setTocados({})
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3">
          Contacto
        </h1>

        <div className="row g-4">
          <div className="col-md-6">
            <p
              style={{
                color: 'var(--jugoseo-texto-tenue)',
              }}
            >
              ¿Tienes una sugerencia, quieres saludar al aire
              o proponer una colaboración?
              Escríbenos y te respondemos a la brevedad.
            </p>

            <ul
              className="list-unstyled"
              style={{
                color: 'var(--jugoseo-texto-claro)',
              }}
            >
              <li className="mb-2">
                📧 contacto@jugoseo.com
              </li>

              <li className="mb-2">
                📍 Chile
              </li>

              <li className="mb-2">
                📻 Al aire las 24 horas
              </li>
            </ul>

            <p className="jugoseo-card-texto mb-0">
              Solo aceptamos correos de dominio @duoc.cl,
              @profesor.duoc.cl o @gmail.com.
            </p>

            <p className="jugoseo-card-texto mt-3">
              Formulario de demostración: el envío está simulado.
            </p>
          </div>

          <div className="col-md-6">
            {aviso && (
              <div
                className={`alert ${
                  exito ? 'alert-success' : 'alert-danger'
                }`}
                role="status"
              >
                {aviso}
              </div>
            )}

            <form onSubmit={enviarMensaje} noValidate>
              <div className="mb-3">
                <label
                  htmlFor="contactoNombre"
                  className="form-label jugoseo-form-label"
                >
                  Nombre
                </label>

                <input
                  type="text"
                  id="contactoNombre"
                  name="nombre"
                  className={`form-control jugoseo-input ${
                    claseCampo('nombre')
                  }`}
                  value={datos.nombre}
                  onChange={cambiarCampo}
                  onBlur={marcarTocado}
                  maxLength={MAX_CARACTERES_NOMBRE}
                  autoComplete="name"
                  required
                  aria-invalid={
                    Boolean(tocados.nombre && errores.nombre)
                  }
                  aria-describedby="errorContactoNombre"
                />

                <div
                  id="errorContactoNombre"
                  className="invalid-feedback"
                >
                  {errores.nombre}
                </div>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="contactoCorreo"
                  className="form-label jugoseo-form-label"
                >
                  Correo
                </label>

                <input
                  type="email"
                  id="contactoCorreo"
                  name="correo"
                  className={`form-control jugoseo-input ${
                    claseCampo('correo')
                  }`}
                  placeholder="tu@duoc.cl / tu@gmail.com"
                  value={datos.correo}
                  onChange={cambiarCampo}
                  onBlur={marcarTocado}
                  maxLength={MAX_CARACTERES_CORREO}
                  autoComplete="email"
                  required
                  aria-invalid={
                    Boolean(tocados.correo && errores.correo)
                  }
                  aria-describedby="errorContactoCorreo"
                />

                <div
                  id="errorContactoCorreo"
                  className="invalid-feedback"
                >
                  {errores.correo}
                </div>
              </div>

              <div className="mb-2">
                <label
                  htmlFor="contactoMensaje"
                  className="form-label jugoseo-form-label"
                >
                  Mensaje
                </label>

                <textarea
                  id="contactoMensaje"
                  name="mensaje"
                  className={`form-control jugoseo-input ${
                    claseCampo('mensaje')
                  }`}
                  rows={4}
                  value={datos.mensaje}
                  onChange={cambiarCampo}
                  onBlur={marcarTocado}
                  maxLength={MAX_CARACTERES_MENSAJE}
                  required
                  aria-invalid={
                    Boolean(tocados.mensaje && errores.mensaje)
                  }
                  aria-describedby="errorContactoMensaje contadorMensaje"
                />

                <div
                  id="errorContactoMensaje"
                  className="invalid-feedback"
                >
                  {errores.mensaje}
                </div>
              </div>

              <div className="d-flex justify-content-end mb-3">
                <small
                  id="contadorMensaje"
                  className={`jugoseo-card-texto ${
                    caracteresMensaje > MAX_CARACTERES_MENSAJE
                      ? 'jugoseo-contador-excedido'
                      : ''
                  }`}
                >
                  {caracteresMensaje} / {MAX_CARACTERES_MENSAJE}
                  {' '}caracteres
                </small>
              </div>

              <button
                type="submit"
                className="btn jugoseo-btn-login w-100"
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}