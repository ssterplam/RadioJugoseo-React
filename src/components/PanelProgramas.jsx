import { useState } from 'react'
import {
  Link,
  useOutletContext,
} from 'react-router-dom'

import EditarProgramaModal from './EditarProgramaModal.jsx'

import {
  actualizarContenidoPrograma,
  asignarLocutor,
  obtenerProgramas,
} from '../utils/programasStorage.js'

import { obtenerLocutores } from '../utils/locutoresStorage.js'
import { leerSesion } from '../data/sesion.js'

import {
  normalizarCorreo,
} from '../utils/validacionesCorreo.js'

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
  const [programaEditando, setProgramaEditando] = useState(null)

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

  function guardarEdicion(datos) {
    if (!programaEditando) {
      return false
    }

    try {
      const actualizados = actualizarContenidoPrograma(
        programaEditando.id,
        datos,
      )

      setEstado((actual) => ({
        ...actual,
        programas: actualizados,
      }))

      setProgramaEditando(null)

      setAviso({
        tipo: 'success',
        texto: 'Programa actualizado.',
      })

      return true
    } catch {
      return false
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
            ? 'Administra el contenido y la asignación de los programas.'
            : 'Consulta y edita tus programas asignados.'}
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

                  <div className="d-flex align-items-center flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn jugoseo-btn-login"
                      onClick={() => {
                        setAviso(null)
                        setProgramaEditando(programa)
                      }}
                    >
                      Editar programa
                    </button>

                    <Link
                      to={`/app/programas/${programa.id}`}
                      className="jugoseo-link"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}

        <p className="jugoseo-card-texto mt-4">
          Los controles de emisión se incorporarán
          en el siguiente bloque.
        </p>

        {programaEditando && (
          <EditarProgramaModal
            key={programaEditando.id}
            programa={programaEditando}
            esAdministrador={esAdministrador}
            cerrar={() => setProgramaEditando(null)}
            guardar={guardarEdicion}
          />
        )}
      </div>
    </section>
  )
}