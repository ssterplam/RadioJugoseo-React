import { useState } from 'react'

import {
  finalizarEmision,
  iniciarEmision,
} from '../utils/programasStorage.js'

import {
  tieneLocutorDisponible,
} from '../utils/locutoresStorage.js'

function comprobarLocutor(correo) {
  try {
    return tieneLocutorDisponible(correo)
  } catch {
    return false
  }
}

export default function ControlesEmision({
  programa,
  emision,
  errorEmision,
}) {
  const [aviso, setAviso] = useState(null)

  const estaActivo = emision?.programaId === programa.id
  const hayOtraEmision = Boolean(emision) && !estaActivo

  const locutorDisponible = comprobarLocutor(
    programa.locutorCorreo,
  )

  const inicioBloqueado =
    Boolean(errorEmision) ||
    hayOtraEmision ||
    !locutorDisponible

  function iniciar() {
    try {
      iniciarEmision(programa.id)

      setAviso({
        tipo: 'success',
        texto: 'Emisión simulada iniciada.',
      })
    } catch {
      setAviso({
        tipo: 'danger',
        texto:
          'No se pudo iniciar la emisión. Comprueba su estado e inténtalo nuevamente.',
      })
    }
  }

  function finalizar() {
    try {
      finalizarEmision(programa.id)

      setAviso({
        tipo: 'success',
        texto: 'Emisión simulada finalizada.',
      })
    } catch {
      setAviso({
        tipo: 'danger',
        texto:
          'No se pudo finalizar la emisión. Comprueba su estado e inténtalo nuevamente.',
      })
    }
  }

  return (
    <div className="mt-3 pt-3 border-top">
      <p className="jugoseo-card-texto mb-2">
        {estaActivo
          ? 'Programa en vivo · simulación'
          : 'Programa sin emisión activa'}
      </p>

      {estaActivo ? (
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={finalizar}
          disabled={Boolean(errorEmision)}
        >
          Finalizar emisión
        </button>
      ) : (
        <button
          type="button"
          className="btn jugoseo-btn-login"
          onClick={iniciar}
          disabled={inicioBloqueado}
        >
          Salir al aire
        </button>
      )}

      {!estaActivo && !locutorDisponible && (
        <p className="jugoseo-card-texto mt-2 mb-0">
          Se requiere un locutor disponible asignado.
        </p>
      )}

      {hayOtraEmision && (
        <p className="jugoseo-card-texto mt-2 mb-0">
          Ya hay otro programa activo.
        </p>
      )}

      {aviso && (
        <div
          className={`alert alert-${aviso.tipo} mt-3 mb-0`}
          role="status"
        >
          {aviso.texto}
        </div>
      )}
    </div>
  )
}