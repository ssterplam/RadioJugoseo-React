import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { usuariosDemo } from '../data/usuariosDemo.js'
import { Link, useNavigate } from 'react-router-dom'
import { esRolValido } from '../data/roles.js'

const dominiosPermitidos = [
  '@duocuc.cl',
  '@gmail.com',
  '@jugoseo.com'
]

export default function LoginModal({ mostrar, cerrar }) {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [exito, setExito] = useState(false)

  function iniciarSesion(evento) {
    evento.preventDefault()

    setMensaje('')
    setExito(false)

    const correoLimpio = correo.trim().toLowerCase()
    const nuevosErrores = {}

    if (!correoLimpio) {
      nuevosErrores.correo = 'Ingrese su correo electrónico'
    } else if (correoLimpio.length > 100) {
      nuevosErrores.correo = 'El correo no puede superar 100 caracteres'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      nuevosErrores.correo = 'El correo debe tener un formato válido'
    } else if (
      correoLimpio !== 'admin@jugoseo.com' &&
      !dominiosPermitidos.some((dominio) =>
        correoLimpio.endsWith(dominio),
      )
    ) {
      nuevosErrores.correo =
        'El dominio debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com'
    }

    if (!password) {
      nuevosErrores.password = 'Ingrese su contraseña'
    } else if (password.length < 4 || password.length > 10) {
      nuevosErrores.password =
        'La contraseña debe tener entre 4 y 10 caracteres'
    }

    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      setMensaje('Revisa los campos marcados en rojo')
      return
    }

    try {
      let cuenta = usuariosDemo.find(
        (usuario) =>
          usuario.correo.toLowerCase() === correoLimpio &&
          usuario.password === password,
      )

      if (!cuenta) {
        const registrados = JSON.parse(
          localStorage.getItem('jugoseoRadioescuchas') || '[]',
        )

        if (!Array.isArray(registrados)) {
          throw new Error('Los datos de usuarios no son válidos')
        }

        cuenta = registrados.find(
          (usuario) =>
            String(usuario.correo || '').toLowerCase() === correoLimpio &&
            usuario.password === password,
        )
      }

      if (!cuenta) {
        setErrores({
          password: 'Correo o contraseña incorrectos',
        })
        setMensaje('Correo o contraseña incorrectos')
        return
      }

      const rol = cuenta.rol || 'Cliente'

      if (!esRolValido(rol)) {
        setMensaje(
          'La cuenta tiene un rol no admitido. ' +
            'Si utilizaba el rol Vendedor, debe ser reasignada por Administración.',
        )
        return
      }

      const nombre = `${cuenta.nombre || ''} ${
        cuenta.apellido || ''
      }`.trim()

      sessionStorage.setItem(
        'jugoseoUsuario',
        JSON.stringify({
          usuario: nombre,
          correo: correoLimpio,
          rol,
          tipo: cuenta.tipo || null,
        }),
      )

      cerrar()
      navigate('/app/inicio', { replace: true }
      )
    } catch {
      setMensaje(
        'No se pudieron leer los usuarios o guardar la sesión. ' +
          'Revisa que el navegador permita el almacenamiento local.',
      )
    }
  }

  return (
    <Modal
      show={mostrar}
      onHide={cerrar}
      centered
      contentClassName="jugoseo-modal"
      aria-labelledby="modalLoginLabel"
    >
      <Modal.Header className="border-0">
        <Modal.Title
          as="h5"
          id="modalLoginLabel"
          className="jugoseo-modal-title"
        >
          Iniciar sesión
        </Modal.Title>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={cerrar}
          aria-label="Cerrar"
        />
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={iniciarSesion} noValidate>
          <div className="mb-3">
            <label htmlFor="loginUsuario" className="form-label">
              Correo electrónico
            </label>

            <input
              type="text"
              id="loginUsuario"
              className={`form-control jugoseo-input ${
                errores.correo ? 'is-invalid' : ''
              }`}
              placeholder="tu@duoc.cl"
              autoComplete="username"
              value={correo}
              onChange={(evento) => {
                setCorreo(evento.target.value)
                setErrores({})
                setMensaje('')
              }}
              required
            />

            <div className="invalid-feedback">
              {errores.correo}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label">
              Contraseña (4 a 10 caracteres)
            </label>

            <input
              type="password"
              id="loginPassword"
              className={`form-control jugoseo-input ${
                errores.password ? 'is-invalid' : ''
              }`}
              placeholder="••••••••"
              autoComplete="current-password"
              maxLength={10}
              value={password}
              onChange={(evento) => {
                setPassword(evento.target.value)
                setErrores({})
                setMensaje('')
              }}
              required
            />

            <div className="invalid-feedback">
              {errores.password}
            </div>
          </div>

          <button
            type="submit"
            className="btn jugoseo-btn-login w-100"
          >
            Entrar
          </button>
        </form>

        {mensaje && (
          <div
            className={`alert ${
              exito ? 'alert-success' : 'alert-danger'
            } mt-3 mb-0`}
            role="status"
          >
            {mensaje}
          </div>
        )}

        <p className="text-center mt-3 mb-0 jugoseo-modal-footer-text">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="jugoseo-link"
            onClick={cerrar}
          >
            Regístrate aquí
          </Link>
        </p>
      </Modal.Body>
    </Modal>
  )
}