import { usuariosDemo } from '../data/usuariosDemo.js'

import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'

export function obtenerLocutores() {
  const guardados = localStorage.getItem('jugoseoRadioescuchas')

  const registrados = guardados === null
    ? []
    : JSON.parse(guardados)

  if (!Array.isArray(registrados)) {
    throw new Error('No se pudo leer la lista de usuarios.')
  }

  const locutores = new Map()

  for (const usuario of [...usuariosDemo, ...registrados]) {
    if (!usuario || usuario.rol !== 'Locutor') {
      continue
    }

    const correo = normalizarCorreo(usuario.correo)

    if (validarCorreoParaRol(correo, usuario.rol)) {
      continue
    }

    if (locutores.has(correo)) {
      continue
    }

    const nombre = [
      usuario.nombre,
      usuario.apellido,
    ]
      .filter((parte) => typeof parte === 'string')
      .join(' ')
      .trim()

    locutores.set(correo, {
      correo,
      nombre: nombre || correo,
    })
  }

  return [...locutores.values()]
}

export function tieneLocutorDisponible(correoIngresado) {
  const correo = normalizarCorreo(correoIngresado)

  if (!correo) {
    return false
  }

  return obtenerLocutores().some(
    (locutor) => locutor.correo === correo,
  )
}