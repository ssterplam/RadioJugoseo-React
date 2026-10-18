import {
  normalizarCorreo,
  validarCorreoParaRol,
} from '../utils/validacionesCorreo.js'

const CLAVE_SESION = 'jugoseoUsuario'

export function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION)

    if (!texto) {
      return null
    }

    const sesion = JSON.parse(texto)

    const estructuraValida =
      sesion &&
      typeof sesion.usuario === 'string' &&
      sesion.usuario.trim() !== '' &&
      typeof sesion.correo === 'string' &&
      sesion.correo.trim() !== ''

    if (!estructuraValida) {
      eliminarSesion()
      return null
    }

    const correo = normalizarCorreo(sesion.correo)

    const errorCuenta = validarCorreoParaRol(
      correo,
      sesion.rol,
    )

    if (errorCuenta) {
      eliminarSesion()
      return null
    }

    return {
      ...sesion,
      correo,
    }
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