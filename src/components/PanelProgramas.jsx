import { useState } from 'react'
import {
  Link,
  useOutletContext,
} from 'react-router-dom'

import EditarProgramaModal from './EditarProgramaModal.jsx'
import ControlesEmision from './ControlesEmision.jsx'

import useEmision from '../hooks/useEmision.js'

import {
  actualizarContenidoPrograma,
  asignarLocutor,
  crearPrograma,
  eliminarPrograma,
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

function programaVacio() {
  return {
    id: null,
    nombre: '',
    conductor: '',
    horarioDetalle: '',
    imagen: '',
    descripcion: '',
    parrafos: [],
    caracteristicas: [],
    locutorCorreo: null,
  }
}

export default function PanelProgramas({
  permitirAltasBajas = false,
}) {
  const { sesion } = useOutletContext()

  const {
    emision,
    programa: programaEnEmision,
    error: errorEmision,
  } = useEmision()

  const [estado, setEstado] = useState(cargarPanel)
  const [aviso, setAviso] = useState(null)
  const [programaEditando, setProgramaEditando] = useState(null)

  const esAdministrador = sesion.rol === 'Administrador'

  const puedeCrearEliminar =
    esAdministrador && permitirAltasBajas

  const esNuevo = programaEditando?.id === null
  const correoActual = normalizarCorreo(sesion.correo)

  const Titulo = permitirAltasBajas ? 'h2' : 'h1'

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

  function abrirCreacion() {
    if (!puedeCrearEliminar || estado.error) {
      return
    }

    setAviso(null)
    setProgramaEditando(programaVacio())
  }

  function guardarFormulario(datos) {
    if (!programaEditando) {
      return false
    }

    const creando = programaEditando.id === null

    if (creando && !puedeCrearEliminar) {
      return false
    }

    try {
      const actualizados = creando
        ? crearPrograma(datos)
        : actualizarContenidoPrograma(
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
        texto: creando
          ? 'Programa creado.'
          : 'Programa actualizado.',
      })

      return true
    } catch {
      return false
    }
  }

  function solicitarEliminacion(programa) {
    if (!puedeCrearEliminar) {
      return
    }

    const confirmado = window.confirm(
      `¿Eliminar el programa "${programa.nombre}"? ` +
        'Esta acción no se puede deshacer desde la aplicación.',
    )

    if (!confirmado) {
      return
    }

    try {
      const actualizados = eliminarPrograma(programa.id)

      setEstado((actual) => ({
        ...actual,
        programas: actualizados,
      }))

      setAviso({
        tipo: 'success',
        texto: 'Programa eliminado.',
      })
    } catch {
      setAviso({
        tipo: 'danger',
        texto:
          'No se pudo eliminar el programa. Comprueba su estado e inténtalo nuevamente.',
      })
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <Titulo className="pagina-titulo h3 mb-0">
            {esAdministrador
              ? 'Gestión de programas'
              : 'Mis programas'}
          </Titulo>

          {puedeCrearEliminar && (
            <button
              type="button"
              className="btn jugoseo-btn-login"
              onClick={abrirCreacion}
              disabled={Boolean(estado.error)}
            >
              Crear programa
            </button>
          )}
        </div>

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

        {errorEmision ? (
          <div className="alert alert-danger" role="alert">
            {errorEmision}
          </div>
        ) : (
          <div className="alert alert-info" role="status">
            {emision
              ? `Emisión simulada activa: ${
                  programaEnEmision?.nombre || 'Programa no disponible'
                }.`
              : 'No hay una emisión simulada activa.'}
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
            {programasVisibles.map((programa) => {
              const estaActivo =
                emision?.programaId === programa.id

              return (
                <div
                  className="col-md-6"
                  key={programa.id}
                >
                  <article className="jugoseo-card">
                    <h3 className="jugoseo-card-titulo">
                      {programa.nombre}
                    </h3>

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
                          disabled={
                            Boolean(errorEmision) || estaActivo
                          }
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

                      {puedeCrearEliminar && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() =>
                            solicitarEliminacion(programa)
                          }
                          disabled={
                            Boolean(errorEmision) || estaActivo
                          }
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    {puedeCrearEliminar && estaActivo && (
                      <p className="jugoseo-card-texto mt-2 mb-0">
                        Finaliza la emisión antes de eliminar
                        el programa.
                      </p>
                    )}

                    <ControlesEmision
                      programa={programa}
                      emision={emision}
                      errorEmision={errorEmision}
                    />
                  </article>
                </div>
              )
            })}
          </div>
        )}

        <p className="jugoseo-card-texto mt-4">
          El estado de emisión es una simulación local.
          No inicia ni detiene la transmisión de audio.
        </p>

        {programaEditando && (
          <EditarProgramaModal
            key={programaEditando.id || 'nuevo-programa'}
            programa={programaEditando}
            esAdministrador={esAdministrador}
            esNuevo={esNuevo}
            cerrar={() => setProgramaEditando(null)}
            guardar={guardarFormulario}
          />
        )}
      </div>
    </section>
  )
}