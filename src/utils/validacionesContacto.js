export const MAX_CARACTERES_MENSAJE = 500
export const MAX_CARACTERES_NOMBRE = 100
export const MAX_CARACTERES_CORREO = 100

const dominiosPermitidos = [
  'duoc.cl',
  'profesor.duoc.cl',
  'gmail.com',
]

export function validarContacto(datos) {
  const errores = {}

  const nombre = datos.nombre.trim()
  const correo = datos.correo.trim()
  const mensaje = datos.mensaje.trim()

  if (!nombre) {
    errores.nombre = 'Ingrese su nombre'
  } else if (nombre.length > MAX_CARACTERES_NOMBRE) {
    errores.nombre =
      `El nombre no puede superar ${MAX_CARACTERES_NOMBRE} caracteres`
  }

  if (!correo) {
    errores.correo = 'Ingrese un correo electrónico'
  } else if (correo.length > MAX_CARACTERES_CORREO) {
    errores.correo =
      `El correo no puede superar ${MAX_CARACTERES_CORREO} caracteres`
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = 'El correo no tiene un formato válido'
  } else {
    const dominio = correo.split('@')[1].toLowerCase()

    if (!dominiosPermitidos.includes(dominio)) {
      errores.correo =
        'Solo se permiten correos @duoc.cl, @profesor.duoc.cl o @gmail.com'
    }
  }

  if (!mensaje) {
    errores.mensaje = 'Ingrese un mensaje'
  } else if (datos.mensaje.length > MAX_CARACTERES_MENSAJE) {
    errores.mensaje =
      `El mensaje no puede superar ${MAX_CARACTERES_MENSAJE} caracteres`
  }

  return errores
}