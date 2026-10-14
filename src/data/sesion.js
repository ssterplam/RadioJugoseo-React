const CLAVE_SESION = 'jugoseoUsuario'

const ROLES_VALIDOS = [
  'Cliente',
  'Vendedor',
  'Administrador',
]

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
      ROLES_VALIDOS.includes(sesion.rol)

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