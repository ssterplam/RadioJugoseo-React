import { esRolValido } from '../data/roles.js'

export const DOMINIOS_PUBLICOS = [
  'duocuc.cl',
  'gmail.com',
]

export const DOMINIO_INTERNO = 'jugoseo.com'

export const DOMINIOS_ACCESO = [
  ...DOMINIOS_PUBLICOS,
  DOMINIO_INTERNO,
]

export function normalizarCorreo(correo) {
  return typeof correo === 'string'
    ? correo.trim().toLowerCase()
    : ''
}

function obtenerDominio(correo) {
  return normalizarCorreo(correo).split('@')[1] || ''
}

function validarCorreo(correo, dominiosPermitidos) {
  const limpio = normalizarCorreo(correo)

  if (!limpio) {
    return 'Ingrese un correo electrónico.'
  }

  if (limpio.length > 100) {
    return 'El correo no puede superar 100 caracteres.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    return 'El correo no tiene un formato válido.'
  }

  if (!dominiosPermitidos.includes(obtenerDominio(limpio))) {
    const dominios = dominiosPermitidos
      .map((dominio) => `@${dominio}`)
      .join(', ')

    return `Dominios permitidos: ${dominios}.`
  }

  return ''
}

export function validarCorreoRegistro(correo) {
  const error = validarCorreo(correo, DOMINIOS_PUBLICOS)

  if (error && obtenerDominio(correo) === DOMINIO_INTERNO) {
    return (
      'Los correos @jugoseo.com están reservados para el personal. '
    )
  }

  return error
}

export function validarCorreoLogin(correo) {
  return validarCorreo(correo, DOMINIOS_ACCESO)
}

export function validarCorreoContacto(correo) {
  return validarCorreo(correo, DOMINIOS_ACCESO)
}

export function validarCorreoParaRol(correo, rol) {
  if (!esRolValido(rol)) {
    return 'La cuenta tiene un rol no admitido.'
  }

  const errorCorreo = validarCorreoLogin(correo)

  if (errorCorreo) {
    return errorCorreo
  }

  const dominio = obtenerDominio(correo)

  if (rol === 'Cliente' && !DOMINIOS_PUBLICOS.includes(dominio)) {
    return (
      'Las cuentas Cliente deben utilizar un correo ' +
      '@duocuc.cl o @gmail.com.'
    )
  }

  if (
    ['Locutor', 'Administrador'].includes(rol) &&
    dominio !== DOMINIO_INTERNO
  ) {
    return (
      'Las cuentas Locutor y Administrador deben utilizar ' +
      'un correo @jugoseo.com.'
    )
  }

  return ''
}