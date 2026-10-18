import { useEffect, useState } from 'react'
import {
  CLAVE_EMISION,
  EVENTO_EMISION,
  obtenerEmision,
} from '../utils/emisionStorage.js'
import {
  obtenerProgramas,
} from '../utils/programasStorage.js'

function cargarEstado() {
  try {
    const emision = obtenerEmision()

    if (!emision) {
      return {
        emision: null,
        programa: null,
        error: '',
      }
    }

    const programa = obtenerProgramas().find(
      (item) => item.id === emision.programaId,
    )

    return {
      emision,
      programa: programa || null,
      error: '',
    }
  } catch {
    return {
      emision: null,
      programa: null,
      error: 'No se pudo consultar el estado de emisión.',
    }
  }
}

export default function useEmision() {
  const [estado, setEstado] = useState(cargarEstado)

  useEffect(() => {
    function actualizar() {
      setEstado(cargarEstado())
    }

    function actualizarDesdeOtraPestana(evento) {
      if (
        evento.key === CLAVE_EMISION ||
        evento.key === 'jugoseoProgramas' ||
        evento.key === null
      ) {
        actualizar()
      }
    }

    window.addEventListener(EVENTO_EMISION, actualizar)
    window.addEventListener(
      'storage',
      actualizarDesdeOtraPestana,
    )

    actualizar()

    return () => {
      window.removeEventListener(EVENTO_EMISION, actualizar)
      window.removeEventListener(
        'storage',
        actualizarDesdeOtraPestana,
      )
    }
  }, [])

  return estado
}