import { esRolValido } from './roles.js'

const CLAVE_SESION = 'jugoseoUsuario'

export function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION)

    if (!texto) {
      return null
    }

    const sesion = JSON.parse(texto)

    const esValida =
      sesion &&
      typeof sesion.usuario === 'string' &&
      sesion.usuario.trim() !== '' &&
      typeof sesion.correo === 'string' &&
      sesion.correo.trim() !== '' &&
      esRolValido(sesion.rol)

    if (!esValida) {
      eliminarSesion()
      return null
    }

    return sesion
  } catch {
    eliminarSesion()
    return null
  }
}

export function eliminarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION)
    return true
  } catch {
    return false
  }
}