import { usuariosDemo } from '../data/usuariosDemo.js'

import {
  normalizarCorreo,
} from './validacionesCorreo.js'

export const CLAVE_USUARIOS = 'jugoseoRadioescuchas'
export const EVENTO_USUARIOS = 'jugoseo-usuarios-actualizados'

export function leerUsuariosLocales() {
  const texto = localStorage.getItem(CLAVE_USUARIOS)

  if (texto === null) {
    return []
  }

  const usuarios = JSON.parse(texto)

  if (
    !Array.isArray(usuarios) ||
    !usuarios.every(
      (usuario) =>
        usuario !== null &&
        typeof usuario === 'object' &&
        typeof usuario.correo === 'string' &&
        normalizarCorreo(usuario.correo) !== '',
    )
  ) {
    throw new Error('No se pudo leer la lista de usuarios.')
  }

  return usuarios
}

export function buscarCuentaPorCorreo(correoIngresado) {
  const correo = normalizarCorreo(correoIngresado)

  const demo = usuariosDemo.find(
    (usuario) =>
      normalizarCorreo(usuario.correo) === correo,
  )

  if (demo) {
    return demo
  }

  const coincidencias = leerUsuariosLocales().filter(
    (usuario) =>
      normalizarCorreo(usuario.correo) === correo,
  )

  if (coincidencias.length > 1) {
    throw new Error('Hay cuentas duplicadas.')
  }

  return coincidencias[0] || null
}