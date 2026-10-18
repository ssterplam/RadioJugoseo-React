import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'

export function validarUsuarioInterno(datos, usuarios = []) {
  const errores = {}

  const nombre =
    typeof datos.nombre === 'string'
      ? datos.nombre.trim()
      : ''

  const apellido =
    typeof datos.apellido === 'string'
      ? datos.apellido.trim()
      : ''

  const correo = normalizarCorreo(datos.correo)

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio.'
  } else if (nombre.length > 50) {
    errores.nombre = 'El nombre no puede superar 50 caracteres.'
  }

  if (!apellido) {
    errores.apellido = 'El apellido es obligatorio.'
  } else if (apellido.length > 100) {
    errores.apellido = 'El apellido no puede superar 100 caracteres.'
  }

  if (!['Locutor', 'Administrador'].includes(datos.rol)) {
    errores.rol = 'Selecciona un rol interno válido.'
  } else {
    const errorCorreo = validarCorreoParaRol(
      correo,
      datos.rol,
    )

    if (errorCorreo) {
      errores.correo = errorCorreo
    }
  }

  if (
    !errores.correo &&
    usuarios.some(
      (usuario) =>
        normalizarCorreo(usuario.correo) === correo,
    )
  ) {
    errores.correo = 'Ya existe una cuenta con este correo.'
  }

  if (
    typeof datos.password !== 'string' ||
    datos.password.length < 4 ||
    datos.password.length > 10
  ) {
    errores.password =
      'La contraseña debe tener entre 4 y 10 caracteres.'
  }

  if (
    typeof datos.passwordConfirm !== 'string' ||
    !datos.passwordConfirm
  ) {
    errores.passwordConfirm = 'Confirma la contraseña.'
  } else if (datos.passwordConfirm !== datos.password) {
    errores.passwordConfirm = 'Las contraseñas no coinciden.'
  }

  return errores
}