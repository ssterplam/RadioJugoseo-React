import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'

import {
  validarEdicionUsuario,
} from '../utils/validacionesUsuario.js'

const campos = [
  ['nombre', 'Nombre', 'text', 50],
  ['apellido', 'Apellido', 'text', 100],
  ['password', 'Nueva contraseña (opcional)', 'password', 10],
  ['passwordConfirm', 'Confirmar nueva contraseña', 'password', 10],
]

export default function EditarUsuarioModal({
  usuario,
  cerrar,
  guardar,
}) {
  const [datos, setDatos] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
    tipo: usuario.tipo || '',
    password: '',
    passwordConfirm: '',
  })

  const [errores, setErrores] = useState({})
  const [errorGuardado, setErrorGuardado] = useState('')

  const roles = usuario.rol === 'Cliente'
    ? ['Cliente']
    : ['Locutor', 'Administrador']

  function cambiar(evento) {
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

    const nuevosErrores = validarEdicionUsuario(
      datos,
      usuario,
    )

    setErrores(nuevosErrores)
    setErrorGuardado('')

    if (Object.keys(nuevosErrores).length > 0) {
      return
    }

    const resultado = guardar(datos)

    if (!resultado.ok) {
      setErrorGuardado(resultado.mensaje)
    }
  }

  return (
    <Modal
      show
      onHide={cerrar}
      centered
      contentClassName="jugoseo-modal"
      aria-labelledby="tituloEditarUsuario"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          id="tituloEditarUsuario"
          className="jugoseo-modal-title"
        >
          Editar usuario
        </Modal.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={cerrar}
          aria-label="Cerrar"
        />
      </Modal.Header>

      <Modal.Body>
        <p className="jugoseo-card-texto">
          {usuario.correo}
        </p>

        {errorGuardado && (
          <div className="alert alert-danger" role="alert">
            {errorGuardado}
          </div>
        )}

        <form onSubmit={enviar} noValidate>
          {campos.map(([nombre, etiqueta, tipo, maximo]) => (
            <div className="mb-3" key={nombre}>
              <label
                htmlFor={`editar-usuario-${nombre}`}
                className="form-label jugoseo-form-label"
              >
                {etiqueta}
              </label>

              <input
                id={`editar-usuario-${nombre}`}
                name={nombre}
                type={tipo}
                maxLength={maximo}
                className={`form-control jugoseo-input ${
                  errores[nombre] ? 'is-invalid' : ''
                }`}
                value={datos[nombre]}
                onChange={cambiar}
                autoComplete={
                  tipo === 'password' ? 'new-password' : undefined
                }
              />

              <div className="invalid-feedback">
                {errores[nombre]}
              </div>
            </div>
          ))}

          <div className="mb-3">
            <label
              htmlFor="editar-usuario-rol"
              className="form-label jugoseo-form-label"
            >
              Rol
            </label>

            <select
              id="editar-usuario-rol"
              name="rol"
              className={`form-select jugoseo-input ${
                errores.rol ? 'is-invalid' : ''
              }`}
              value={datos.rol}
              onChange={cambiar}
            >
              {!roles.includes(datos.rol) && (
                <option value={datos.rol} disabled>
                  {datos.rol}
                </option>
              )}

              {roles.map((rol) => (
                <option value={rol} key={rol}>
                  {rol}
                </option>
              ))}
            </select>

            <div className="invalid-feedback">
              {errores.rol}
            </div>
          </div>

          {datos.rol === 'Cliente' && (
            <div className="mb-3">
              <label
                htmlFor="editar-usuario-tipo"
                className="form-label jugoseo-form-label"
              >
                Tipo de oyente
              </label>

              <select
                id="editar-usuario-tipo"
                name="tipo"
                className={`form-select jugoseo-input ${
                  errores.tipo ? 'is-invalid' : ''
                }`}
                value={datos.tipo}
                onChange={cambiar}
              >
                <option value="" disabled>
                  Selecciona un tipo
                </option>
                <option value="Socio VIP">Socio VIP</option>
                <option value="Radioescucha Oficial">
                  Radioescucha Oficial
                </option>
              </select>

              <div className="invalid-feedback">
                {errores.tipo}
              </div>
            </div>
          )}

          <p className="jugoseo-card-texto">
            Deja ambas contraseñas vacías para conservar la actual.
            Guardar requerirá que esta cuenta vuelva a iniciar sesión.
          </p>

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