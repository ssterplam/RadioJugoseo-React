import { useState } from 'react'

import UsuarioInternoModal from './UsuarioInternoModal.jsx'

import {
  crearUsuarioInterno,
  obtenerUsuariosAdministrables,
} from '../utils/usuariosStorage.js'

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

function formatearFecha(valor) {
  if (!valor) {
    return '—'
  }

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return '—'
  }

  return fecha.toLocaleDateString('es-CL')
}

export default function PanelUsuarios() {
  const [estado, setEstado] = useState(cargarPanel)
  const [mostrarCreacion, setMostrarCreacion] = useState(false)
  const [aviso, setAviso] = useState(null)

  function guardar(datos) {
    try {
      const usuarios = crearUsuarioInterno(datos)

      setEstado({
        usuarios,
        error: '',
      })

      setMostrarCreacion(false)

      setAviso({
        tipo: 'success',
        texto: 'Cuenta creada.',
      })

      return true
    } catch {
      return false
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
                  <th scope="col">Revisión</th>
                </tr>
              </thead>

              <tbody>
                {estado.usuarios.map((usuario, indice) => (
                  <tr
                    key={`${usuario.origen}-${usuario.correo}-${indice}`}
                  >
                    <td>
                      {usuario.nombre} {usuario.apellido}
                    </td>

                    <td>{usuario.correo}</td>
                    <td>{usuario.rol}</td>
                    <td>{usuario.tipo || '—'}</td>
                    <td>{usuario.origen}</td>

                    <td>
                      {formatearFecha(usuario.fechaCreacion)}
                    </td>

                    <td>
                      {usuario.requiereRevision ? (
                        <span className="badge bg-warning text-dark">
                          Revisar dominio o rol
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="jugoseo-card-texto mt-4">
          La edición, los cambios de rol y las bajas
          se incorporarán en el siguiente bloque.
        </p>

        {mostrarCreacion && (
          <UsuarioInternoModal
            usuarios={estado.usuarios}
            cerrar={() => setMostrarCreacion(false)}
            guardar={guardar}
          />
        )}
      </div>
    </section>
  )
}