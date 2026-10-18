import {
  programas as programasIniciales,
} from '../data/programas.js'

import { leerSesion } from '../data/sesion.js'

import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'

import { obtenerLocutores } from './locutoresStorage.js'

/* Qué se está definiendo en este archivo:
* locutorCorreo: null: programa sin asignar.
* locutorCorreo: 'locutor@jugoseo.com': programa asignado a esa cuenta.
* La asignación solo se escribe cuando la realiza Administrador.
* Si falla el guardado, la función no devuelve una actualización exitosa.
* Si existen datos dañados, no se reemplazan silenciosamente.
* Una lista vacía guardada se respeta; no se repone automáticamente.*/

const CLAVE_PROGRAMAS = 'jugoseoProgramas'

function esTexto(valor) {
  return typeof valor === 'string' && valor.trim() !== ''
}

function esListaDeTextos(valor) {
  return (
    Array.isArray(valor) &&
    valor.every(esTexto)
  )
}

function esProgramaValido(programa) {
  return (
    programa !== null &&
    typeof programa === 'object' &&
    esTexto(programa.id) &&
    esTexto(programa.nombre) &&
    esTexto(programa.conductor) &&
    esTexto(programa.horarioDetalle) &&
    esTexto(programa.imagen) &&
    esTexto(programa.descripcion) &&
    esListaDeTextos(programa.parrafos) &&
    esListaDeTextos(programa.caracteristicas) &&
    (
      programa.locutorCorreo === null ||
      (
        esTexto(programa.locutorCorreo) &&
        !validarCorreoParaRol(
          programa.locutorCorreo,
          'Locutor',
        )
      )
    )
  )
}

function validarLista(programas) {
  if (
    !Array.isArray(programas) ||
    !programas.every(esProgramaValido)
  ) {
    throw new Error('Los datos de programas no son válidos.')
  }

  const identificadores = programas.map(
    (programa) => programa.id,
  )

  if (
    new Set(identificadores).size !== identificadores.length
  ) {
    throw new Error('Hay identificadores de programa repetidos.')
  }
}

export function obtenerProgramas() {
  const guardados = localStorage.getItem(CLAVE_PROGRAMAS)

  if (guardados === null) {
    return programasIniciales.map((programa) => ({
      ...programa,
      parrafos: [...programa.parrafos],
      caracteristicas: [...programa.caracteristicas],
      locutorCorreo: null,
    }))
  }

  const programas = JSON.parse(guardados)

  validarLista(programas)

  return programas
}

export function cargarCatalogoProgramas() {
  try {
    return {
      programas: obtenerProgramas(),
      error: '',
    }
  } catch {
    return {
      programas: [],
      error:
        'No se pudieron cargar los programas. Inténtalo nuevamente.',
    }
  }
}

export function asignarLocutor(programaId, correoIngresado) {
  const sesion = leerSesion()

  if (!sesion || sesion.rol !== 'Administrador') {
    throw new Error('Operación no permitida.')
  }

  const correo = normalizarCorreo(correoIngresado)

  if (correo) {
    const locutores = obtenerLocutores()

    const existe = locutores.some(
      (locutor) => locutor.correo === correo,
    )

    if (!existe) {
      throw new Error('El locutor seleccionado no está disponible.')
    }
  }

  const programas = obtenerProgramas()

  const existePrograma = programas.some(
    (programa) => programa.id === programaId,
  )

  if (!existePrograma) {
    throw new Error('El programa no está disponible.')
  }

  const actualizados = programas.map((programa) =>
    programa.id === programaId
      ? {
          ...programa,
          locutorCorreo: correo || null,
        }
      : programa,
  )

  validarLista(actualizados)

  localStorage.setItem(
    CLAVE_PROGRAMAS,
    JSON.stringify(actualizados),
  )

  return actualizados
}