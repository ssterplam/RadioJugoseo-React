import {
  validarCorreoContacto,
} from './validacionesCorreo.js'

export const MAX_CARACTERES_MENSAJE = 500
export const MAX_CARACTERES_NOMBRE = 100
export const MAX_CARACTERES_CORREO = 100

export function validarContacto(datos) {
  const errores = {}

  const nombre = datos.nombre.trim()
  const mensaje = datos.mensaje.trim()

  if (!nombre) {
    errores.nombre = 'Ingrese su nombre'
  } else if (nombre.length > MAX_CARACTERES_NOMBRE) {
    errores.nombre =
      `El nombre no puede superar ${MAX_CARACTERES_NOMBRE} caracteres`
  }

  const errorCorreo = validarCorreoContacto(datos.correo)

  if (errorCorreo) {
    errores.correo = errorCorreo
  }

  if (!mensaje) {
    errores.mensaje = 'Ingrese un mensaje'
  } else if (datos.mensaje.length > MAX_CARACTERES_MENSAJE) {
    errores.mensaje =
      `El mensaje no puede superar ${MAX_CARACTERES_MENSAJE} caracteres`
  }

  return errores
}