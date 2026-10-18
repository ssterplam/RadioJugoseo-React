import {
  validarCorreoParaRol,
} from './validacionesCorreo.js'

export const CLAVE_EMISION = 'jugoseoEmision'
export const EVENTO_EMISION = 'jugoseo-emision-actualizada'

export function notificarCambioEmision() {
  window.dispatchEvent(new Event(EVENTO_EMISION))
}

export function obtenerEmision() {
  const texto = localStorage.getItem(CLAVE_EMISION)

  if (texto === null) {
    return null
  }

  const emision = JSON.parse(texto)

  const esValida =
    emision &&
    typeof emision.programaId === 'string' &&
    emision.programaId.trim() !== '' &&
    typeof emision.iniciadaPor === 'string' &&
    !validarCorreoParaRol(emision.iniciadaPor, 'Locutor') &&
    typeof emision.inicio === 'string' &&
    !Number.isNaN(Date.parse(emision.inicio))

  if (!esValida) {
    throw new Error('Estado de emisión inválido.')
  }

  return emision
}

export function guardarEmision(emision) {
  if (emision === null) {
    localStorage.removeItem(CLAVE_EMISION)
  } else {
    localStorage.setItem(
      CLAVE_EMISION,
      JSON.stringify(emision),
    )
  }

  notificarCambioEmision()
}