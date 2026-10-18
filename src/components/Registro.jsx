import { useState } from 'react'
import { Link } from 'react-router-dom'

import { regionesComunas } from '../data/regionesComunas.js'
import { usuariosDemo } from '../data/usuariosDemo.js'
import { validarRegistro } from '../utils/validacionesRegistro.js'

const valoresIniciales = {
  nombre: '',
  apellido: '',
  correo: '',
  run: '',
  password: '',
  passwordConfirm: '',
  fechaNacimiento: '',
  direccion: '',
  region: '',
  comuna: '',
  tipo: '',
}

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    tipo: 'text',
    ancho: 'col-md-6',
    maxLength: 50,
    obligatorio: true,
  },
  {
    nombre: 'apellido',
    etiqueta: 'Apellido',
    tipo: 'text',
    ancho: 'col-md-6',
    maxLength: 100,
    obligatorio: true,
  },
  {
    nombre: 'correo',
    etiqueta: 'Correo electrónico',
    tipo: 'email',
    ancho: 'col-12',
    maxLength: 100,
    placeholder: 'tu@duocuc.cl / tu@gmail.com',
    obligatorio: true,
  },
  {
    nombre: 'run',
    etiqueta: 'RUN (sin puntos ni guion)',
    tipo: 'text',
    ancho: 'col-12',
    maxLength: 9,
    placeholder: '12345678K',
    obligatorio: true,
  },
  {
    nombre: 'password',
    etiqueta: 'Contraseña',
    tipo: 'password',
    ancho: 'col-md-6',
    minLength: 4,
    maxLength: 10,
    placeholder: '4 a 10 caracteres',
    obligatorio: true,
  },
  {
    nombre: 'passwordConfirm',
    etiqueta: 'Confirmar contraseña',
    tipo: 'password',
    ancho: 'col-md-6',
    minLength: 4,
    maxLength: 10,
    placeholder: 'Repite tu contraseña',
    obligatorio: true,
  },
  {
    nombre: 'fechaNacimiento',
    etiqueta: 'Fecha de nacimiento (opcional)',
    tipo: 'date',
    ancho: 'col-12',
    obligatorio: false,
  },
  {
    nombre: 'direccion',
    etiqueta: 'Dirección (opcional)',
    tipo: 'text',
    ancho: 'col-12',
    maxLength: 300,
    placeholder: 'Calle, número, departamento',
    obligatorio: false,
  },
]

export default function Registro() {
  const [datos, setDatos] = useState({ ...valoresIniciales })
  const [errores, setErrores] = useState({})
  const [tocados, setTocados] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [exito, setExito] = useState(false)

  const comunas = regionesComunas[datos.region] || []

  function cambiarCampo(evento) {
    const { name, value } = evento.target

    const nuevosDatos = {
      ...datos,
      [name]: value,
    }

    if (name === 'region') {
      nuevosDatos.comuna = ''
      setTocados((actual) => ({
        ...actual,
        comuna: false,
      }))
    }

    setDatos(nuevosDatos)
    setErrores(validarRegistro(nuevosDatos))
    setMensaje('')
    setExito(false)
  }

  function marcarTocado(evento) {
    const { name } = evento.target

    setTocados((actual) => ({
      ...actual,
      [name]: true,
    }))

    setErrores(validarRegistro(datos))
  }

  function claseCampo(nombre) {
    if (!tocados[nombre]) {
      return ''
    }

    if (errores[nombre]) {
      return 'is-invalid'
    }

    return datos[nombre] ? 'is-valid' : ''
  }

  function crearCuenta(evento) {
    evento.preventDefault()

    const nuevosErrores = validarRegistro(datos)

    setErrores(nuevosErrores)
    setTocados(
      Object.fromEntries(
        Object.keys(valoresIniciales).map((nombre) => [nombre, true]),
      ),
    )
    setExito(false)

    if (Object.keys(nuevosErrores).length > 0) {
      setMensaje('Revisa los campos marcados en rojo antes de continuar.')
      return
    }

    const correo = datos.correo.trim().toLowerCase()
    const run = datos.run.trim().toUpperCase()

    try {
      const lista = JSON.parse(
        localStorage.getItem('jugoseoRadioescuchas') || '[]',
      )

      if (!Array.isArray(lista)) {
        throw new Error('El listado de usuarios no es válido')
      }

      const correoExiste =
        usuariosDemo.some(
          (usuario) => usuario.correo.toLowerCase() === correo,
        ) ||
        lista.some(
          (usuario) =>
            String(usuario?.correo || '').toLowerCase() === correo,
        )

      const runExiste = lista.some(
        (usuario) =>
          String(usuario?.run || '').toUpperCase() === run,
      )

      const duplicados = {}

      if (correoExiste) {
        duplicados.correo =
          'Este correo ya está registrado o pertenece a una cuenta de demostración.'
      }

      if (runExiste) {
        duplicados.run = 'Ya existe una cuenta registrada con este RUN.'
      }

      if (Object.keys(duplicados).length > 0) {
        setErrores(duplicados)
        setMensaje(
          'No se creó la cuenta. Revisa el correo y el RUN ingresados.',
        )
        return
      }

      const nuevaCuenta = {
        id: `usuario-${crypto.randomUUID()}`,
        versionCuenta: 0,
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo,
        run,
        region: datos.region,
        comuna: datos.comuna,
        tipo: datos.tipo,
        rol: 'Cliente',
        password: datos.password,
        fechaNacimiento: datos.fechaNacimiento || null,
        direccion: datos.direccion.trim() || null,
        fechaCreacion: new Date().toISOString(),
      }

      localStorage.setItem(
        'jugoseoRadioescuchas',
        JSON.stringify([...lista, nuevaCuenta]),
      )

      setDatos({ ...valoresIniciales })
      setErrores({})
      setTocados({})
      setExito(true)
      setMensaje(
        `¡Listo, ${nuevaCuenta.nombre}! Tu cuenta como ` +
          `${nuevaCuenta.tipo} fue creada. Vuelve a la portada para iniciar sesión.`,
      )
    } catch {
      setMensaje(
        'No se pudo leer o guardar el registro local. ' +
          'Revisa el almacenamiento del navegador. No se reemplazaron tus datos.',
      )
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container" style={{ maxWidth: 640 }}>
        <Link
          to="/"
          className="jugoseo-link d-inline-block mb-4"
        >
          ← Volver a la portada
        </Link>

        <h1 className="pagina-titulo h3 mb-1">
          Únete a Jugoseo
        </h1>

        <p
          className="mb-4"
          style={{ color: 'var(--jugoseo-texto-tenue)' }}
        >
          Regístrate como Socio VIP o Radioescucha Oficial
          y accede a beneficios exclusivos.
        </p>

        {mensaje && (
          <div
            className={`alert ${
              exito ? 'alert-success' : 'alert-danger'
            }`}
            role="status"
          >
            {mensaje}
          </div>
        )}

        <form onSubmit={crearCuenta} noValidate>
          <div className="row g-3">
            {campos.map((campo) => (
              <div
                className={campo.ancho}
                key={campo.nombre}
              >
                <label
                  htmlFor={`reg-${campo.nombre}`}
                  className="form-label jugoseo-form-label"
                >
                  {campo.etiqueta}
                </label>

                <input
                  id={`reg-${campo.nombre}`}
                  name={campo.nombre}
                  type={campo.tipo}
                  className={`form-control jugoseo-input ${
                    claseCampo(campo.nombre)
                  }`}
                  value={datos[campo.nombre]}
                  onChange={cambiarCampo}
                  onBlur={marcarTocado}
                  minLength={campo.minLength}
                  maxLength={campo.maxLength}
                  placeholder={campo.placeholder}
                  required={campo.obligatorio}
                  autoComplete={
                    campo.tipo === 'password'
                      ? 'new-password'
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      tocados[campo.nombre] &&
                        errores[campo.nombre],
                    )
                  }
                  aria-describedby={`error-${campo.nombre}`}
                />

                <div
                  id={`error-${campo.nombre}`}
                  className="invalid-feedback"
                >
                  {errores[campo.nombre]}
                </div>
              </div>
            ))}

            <div className="col-md-6">
              <label
                htmlFor="reg-region"
                className="form-label jugoseo-form-label"
              >
                Región
              </label>

              <select
                id="reg-region"
                name="region"
                className={`form-select jugoseo-input ${
                  claseCampo('region')
                }`}
                value={datos.region}
                onChange={cambiarCampo}
                onBlur={marcarTocado}
                required
              >
                <option value="" disabled>
                  Selecciona una región
                </option>

                {Object.keys(regionesComunas).map((region) => (
                  <option value={region} key={region}>
                    {region}
                  </option>
                ))}
              </select>

              <div className="invalid-feedback">
                {errores.region}
              </div>
            </div>

            <div className="col-md-6">
              <label
                htmlFor="reg-comuna"
                className="form-label jugoseo-form-label"
              >
                Comuna
              </label>

              <select
                id="reg-comuna"
                name="comuna"
                className={`form-select jugoseo-input ${
                  claseCampo('comuna')
                }`}
                value={datos.comuna}
                onChange={cambiarCampo}
                onBlur={marcarTocado}
                disabled={!datos.region}
                required
              >
                <option value="" disabled>
                  {datos.region
                    ? 'Selecciona una comuna'
                    : 'Primero elige una región'}
                </option>

                {comunas.map((comuna) => (
                  <option value={comuna} key={comuna}>
                    {comuna}
                  </option>
                ))}
              </select>

              <div className="invalid-feedback">
                {errores.comuna}
              </div>
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="form-label jugoseo-form-label">
              Tipo de registro
            </legend>

            {['Socio VIP', 'Radioescucha Oficial'].map(
              (tipo, indice) => (
                <div
                  className="form-check form-check-inline"
                  key={tipo}
                >
                  <input
                    id={`reg-tipo-${indice}`}
                    name="tipo"
                    type="radio"
                    className="form-check-input"
                    value={tipo}
                    checked={datos.tipo === tipo}
                    onChange={cambiarCampo}
                    onBlur={marcarTocado}
                  />

                  <label
                    htmlFor={`reg-tipo-${indice}`}
                    className="form-check-label"
                  >
                    {tipo}
                  </label>
                </div>
              ),
            )}

            {tocados.tipo && errores.tipo && (
              <div className="jugoseo-form-error mt-1">
                {errores.tipo}
              </div>
            )}
          </fieldset>

          <button
            type="submit"
            className="btn jugoseo-btn-login w-100 mt-4"
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </section>
  )
}