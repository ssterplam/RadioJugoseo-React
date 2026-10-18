import {
  normalizarCorreo,
  validarCorreoParaRol,
} from '../utils/validacionesCorreo.js'

import {
  buscarCuentaPorCorreo,
} from '../utils/cuentasLectura.js'

const CLAVE_SESION = 'jugoseoUsuario'

export function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION)

    if (!texto) {
      return null
    }

    const sesion = JSON.parse(texto)

    if (
      !sesion ||
      typeof sesion.correo !== 'string'
    ) {
      eliminarSesion()
      return null
    }

    const correo = normalizarCorreo(sesion.correo)
    const cuenta = buscarCuentaPorCorreo(correo)

    if (!cuenta) {
      eliminarSesion()
      return null
    }

    const rol = cuenta.rol || 'Cliente'
    const version = cuenta.versionCuenta ?? 0

    const coincide =
      sesion.rol === rol &&
      (sesion.cuentaId ?? null) === (cuenta.id || null) &&
      (sesion.versionCuenta ?? 0) === version

    const correoValido = !validarCorreoParaRol(
      correo,
      rol,
    )

    const nombre = [
      cuenta.nombre,
      cuenta.apellido,
    ]
      .filter((parte) => typeof parte === 'string')
      .join(' ')
      .trim()

    if (
      !coincide ||
      !correoValido ||
      !nombre ||
      !Number.isSafeInteger(version) ||
      version < 0
    ) {
      eliminarSesion()
      return null
    }

    return {
      ...sesion,
      usuario: nombre,
      correo,
      rol,
      tipo: cuenta.tipo || null,
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