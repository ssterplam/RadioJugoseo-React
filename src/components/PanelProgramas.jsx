import { useState } from 'react'
import {
  Link,
  useOutletContext,
} from 'react-router-dom'

import {
  asignarLocutor,
  obtenerProgramas,
} from '../utils/programasStorage.js'

import { obtenerLocutores } from '../utils/locutoresStorage.js'
import { leerSesion } from '../data/sesion.js'

import {
  normalizarCorreo,
} from '../utils/validacionesCorreo.js'

/* Administrador: ve todos los programas y puede asignarlos.
* Locutor: ve únicamente sus programas y no puede cambiar la asignación. */

function cargarPanel() {
  try {
    const sesion = leerSesion()

    if (
      !sesion ||
      !['Locutor', 'Administrador'].includes(sesion.rol)
    ) {
      throw new Error('Acceso no permitido.')
    }

    return {
      programas: obtenerProgramas(),
      locutores:
        sesion.rol === 'Administrador'
          ? obtenerLocutores()
          : [],
      error: '',
    }
  } catch {
    return {
      programas: [],
      locutores: [],
      error:
        'No se pudo cargar esta sección. Inténtalo nuevamente.',
    }
  }
}

export default function PanelProgramas() {
  const { sesion } = useOutletContext()

  const [estado, setEstado] = useState(cargarPanel)
  const [aviso, setAviso] = useState(null)

  const esAdministrador = sesion.rol === 'Administrador'
  const correoActual = normalizarCorreo(sesion.correo)

  const programasVisibles = esAdministrador
    ? estado.programas
    : estado.programas.filter(
        (programa) =>
          normalizarCorreo(programa.locutorCorreo) === correoActual,
      )

  function cambiarAsignacion(programaId, correo) {
    try {
      const actualizados = asignarLocutor(
        programaId,
        correo,
      )

      setEstado((actual) => ({
        ...actual,
        programas: actualizados,
      }))

      setAviso({
        tipo: 'success',
        texto: 'Asignación actualizada.',
      })
    } catch {
      setAviso({
        tipo: 'danger',
        texto:
          'No se pudo guardar el cambio. La asignación no se modificó.',
      })
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3">
          {esAdministrador
            ? 'Gestión de programas'
            : 'Mis programas'}
        </h1>

        <p className="jugoseo-card-texto">
          {esAdministrador
            ? 'Selecciona la cuenta responsable de cada programa. Los cambios se guardan al seleccionar.'
            : 'Estos son los programas asignados a tu cuenta.'}
        </p>

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
        ) : programasVisibles.length === 0 ? (
          <p className="jugoseo-card-texto">
            {esAdministrador
              ? 'No hay programas disponibles.'
              : 'No tienes programas asignados.'}
          </p>
        ) : (
          <div className="row g-4">
            {programasVisibles.map((programa) => (
              <div
                className="col-md-6"
                key={programa.id}
              >
                <article className="jugoseo-card">
                  <h2 className="jugoseo-card-titulo">
                    {programa.nombre}
                  </h2>

                  <p className="jugoseo-card-texto">
                    {programa.horarioDetalle}
                  </p>

                  {esAdministrador ? (
                    <div className="mb-3">
                      <label
                        htmlFor={`locutor-${programa.id}`}
                        className="form-label jugoseo-form-label"
                      >
                        Locutor asignado
                      </label>

                      <select
                        id={`locutor-${programa.id}`}
                        className="form-select jugoseo-input"
                        value={programa.locutorCorreo || ''}
                        onChange={(evento) =>
                          cambiarAsignacion(
                            programa.id,
                            evento.target.value,
                          )
                        }
                      >
                        <option value="">
                          Sin asignar
                        </option>

                        {programa.locutorCorreo &&
                          !estado.locutores.some(
                            (locutor) =>
                              locutor.correo === programa.locutorCorreo,
                          ) && (
                            <option
                              value={programa.locutorCorreo}
                              disabled
                            >
                              Cuenta no disponible
                            </option>
                          )}

                        {estado.locutores.map((locutor) => (
                          <option
                            value={locutor.correo}
                            key={locutor.correo}
                          >
                            {locutor.nombre} — {locutor.correo}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="jugoseo-card-texto">
                      Asignado a tu cuenta.
                    </p>
                  )}

                  <Link
                    to={`/app/programas/${programa.id}`}
                    className="jugoseo-link"
                  >
                    Ver ficha del programa
                  </Link>
                </article>
              </div>
            ))}
          </div>
        )}

        <p className="jugoseo-card-texto mt-4">
          La edición de contenido y los controles de emisión
          se incorporarán en el siguiente bloque.
        </p>
      </div>
    </section>
  )
}