import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import UsuarioInternoModal from './UsuarioInternoModal.jsx'
import EditarUsuarioModal from './EditarUsuarioModal.jsx'

import {
  actualizarUsuario,
  crearUsuarioInterno,
  eliminarUsuario,
  obtenerUsuariosAdministrables,
} from '../utils/usuariosStorage.js'

import {
  normalizarCorreo,
} from '../utils/validacionesCorreo.js'

function cargarPanel() {
  try {
    return {
      usuarios: obtenerUsuariosAdministrables(),
      error: '',
    }
  } catch {
    return {
      usuarios: [],
      error:
        'No se pudo cargar esta sección. Inténtalo nuevamente.',
    }
  }
}

function mensajeError(error) {
  const mensajes = {
    CUENTA_PROTEGIDA: 'Esta cuenta está protegida.',
    CUENTA_NO_DISPONIBLE: 'La cuenta no está disponible.',
    USUARIO_ASIGNADO:
      'Reasigna o quita primero los programas vinculados a esta cuenta.',
    EMISION_ACTIVA:
      'Finaliza primero la emisión iniciada por esta cuenta.',
    DATOS_INVALIDOS:
      'Revisa los datos ingresados.',
  }

  return mensajes[error.codigo] ||
    'No se pudo completar la operación. Inténtalo nuevamente.'
}

function formatearFecha(valor) {
  if (!valor) return '—'

  const fecha = new Date(valor)

  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleDateString('es-CL')
}

export default function PanelUsuarios() {
  const { sesion } = useOutletContext()

  const [estado, setEstado] = useState(cargarPanel)
  const [mostrarCreacion, setMostrarCreacion] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [aviso, setAviso] = useState(null)

  function guardarCreacion(datos) {
    try {
      const usuarios = crearUsuarioInterno(datos)

      setEstado({ usuarios, error: '' })
      setMostrarCreacion(false)
      setAviso({ tipo: 'success', texto: 'Cuenta creada.' })

      return true
    } catch {
      return false
    }
  }

  function guardarEdicion(datos) {
    if (!usuarioEditando) {
      return { ok: false, mensaje: 'La cuenta no está disponible.' }
    }

    try {
      const usuarios = actualizarUsuario(
        usuarioEditando.correo,
        datos,
      )

      setEstado({ usuarios, error: '' })
      setUsuarioEditando(null)
      setAviso({ tipo: 'success', texto: 'Cuenta actualizada.' })

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        mensaje: mensajeError(error),
      }
    }
  }

  function solicitarEliminacion(usuario) {
    if (
      !window.confirm(
        `¿Eliminar la cuenta "${usuario.correo}"? ` +
          'Esta acción no se puede deshacer desde la aplicación.',
      )
    ) {
      return
    }

    try {
      const usuarios = eliminarUsuario(usuario.correo)

      setEstado({ usuarios, error: '' })
      setAviso({ tipo: 'success', texto: 'Cuenta eliminada.' })
    } catch (error) {
      setAviso({
        tipo: 'danger',
        texto: mensajeError(error),
      })
    }
  }

  return (
    <section className="pagina-interna">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <h2 className="pagina-titulo h3 mb-0">
            Gestión de usuarios
          </h2>

          <button
            type="button"
            className="btn jugoseo-btn-login"
            disabled={Boolean(estado.error)}
            onClick={() => {
              setAviso(null)
              setMostrarCreacion(true)
            }}
          >
            Crear cuenta interna
          </button>
        </div>

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
        ) : (
          <div className="table-responsive">
            <table className="table jugoseo-tabla-programas align-middle">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Tipo de oyente</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Creación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {estado.usuarios.map((usuario, indice) => {
                  const esPropia =
                    normalizarCorreo(usuario.correo) ===
                    normalizarCorreo(sesion.correo)

                  const protegida =
                    usuario.origen === 'Demostración' || esPropia

                  return (
                    <tr
                      key={`${usuario.origen}-${usuario.correo}-${indice}`}
                    >
                      <td>
                        {usuario.nombre} {usuario.apellido}
                      </td>
                      <td>
                        {usuario.correo}

                        {usuario.requiereRevision && (
                          <div className="text-warning small">
                            Revisar dominio o rol
                          </div>
                        )}
                      </td>
                      <td>{usuario.rol}</td>
                      <td>{usuario.tipo || '—'}</td>
                      <td>{usuario.origen}</td>
                      <td>
                        {formatearFecha(usuario.fechaCreacion)}
                      </td>

                      <td>
                        {protegida ? (
                          <span className="jugoseo-card-texto">
                            {esPropia
                              ? 'Tu cuenta'
                              : 'Cuenta de demostración'}
                          </span>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-light"
                              onClick={() => {
                                setAviso(null)
                                setUsuarioEditando(usuario)
                              }}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                solicitarEliminacion(usuario)
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {mostrarCreacion && (
          <UsuarioInternoModal
            usuarios={estado.usuarios}
            cerrar={() => setMostrarCreacion(false)}
            guardar={guardarCreacion}
          />
        )}

        {usuarioEditando && (
          <EditarUsuarioModal
            key={usuarioEditando.correo}
            usuario={usuarioEditando}
            cerrar={() => setUsuarioEditando(null)}
            guardar={guardarEdicion}
          />
        )}
      </div>
    </section>
  )
}