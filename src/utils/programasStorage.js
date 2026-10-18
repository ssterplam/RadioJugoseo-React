import {
  programas as programasIniciales,
} from '../data/programas.js'
import { leerSesion } from '../data/sesion.js'
import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'
import {
  separarLineas,
  validarEdicionPrograma,
} from './validacionesPrograma.js'
import {
  guardarEmision,
  notificarCambioEmision,
  obtenerEmision,
} from './emisionStorage.js'
import {
  obtenerLocutores,
  tieneLocutorDisponible,
} from './locutoresStorage.js'

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

  const emision = obtenerEmision()

  if (emision?.programaId === programaId) {
    throw new Error('Finaliza la emisión antes de reasignar el programa.')
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

export function actualizarContenidoPrograma(programaId, datos) {
  const sesion = leerSesion()

  if (
    !sesion ||
    !['Locutor', 'Administrador'].includes(sesion.rol)
  ) {
    throw new Error('Operación no permitida.')
  }

  const programas = obtenerProgramas()

  const programaActual = programas.find(
    (programa) => programa.id === programaId,
  )

  if (!programaActual) {
    throw new Error('El programa no está disponible.')
  }

  const esAdministrador = sesion.rol === 'Administrador'

  const esPropietario =
    programaActual.locutorCorreo !== null &&
    normalizarCorreo(programaActual.locutorCorreo) ===
      normalizarCorreo(sesion.correo)

  if (!esAdministrador && !esPropietario) {
    throw new Error('Operación no permitida.')
  }

  const errores = validarEdicionPrograma(
    datos,
    esAdministrador,
  )

  if (Object.keys(errores).length > 0) {
    throw new Error('Los datos ingresados no son válidos.')
  }

  const contenido = {
    descripcion: datos.descripcion.trim(),
    imagen: datos.imagen.trim(),
    parrafos: separarLineas(datos.parrafos),
    caracteristicas: separarLineas(datos.caracteristicas),
  }

  if (esAdministrador) {
    contenido.nombre = datos.nombre.trim()
    contenido.conductor = datos.conductor.trim()
    contenido.horarioDetalle = datos.horarioDetalle.trim()
  }

  const actualizados = programas.map((programa) =>
    programa.id === programaId
      ? {
          ...programa,
          ...contenido,
        }
      : programa,
  )

  validarLista(actualizados)

  localStorage.setItem(
    CLAVE_PROGRAMAS,
    JSON.stringify(actualizados),
  )

  notificarCambioEmision()

  return actualizados
}

function obtenerSesionDeEmision() {
  const sesion = leerSesion()

  if (
    !sesion ||
    !['Locutor', 'Administrador'].includes(sesion.rol)
  ) {
    throw new Error('Operación no permitida.')
  }

  return sesion
}

function puedeControlarPrograma(sesion, programa) {
  if (sesion.rol === 'Administrador') {
    return true
  }

  return (
    programa &&
    programa.locutorCorreo !== null &&
    normalizarCorreo(programa.locutorCorreo) ===
      normalizarCorreo(sesion.correo)
  )
}

export function iniciarEmision(programaId) {
  const sesion = obtenerSesionDeEmision()

  const programa = obtenerProgramas().find(
    (item) => item.id === programaId,
  )

  if (!programa || !puedeControlarPrograma(sesion, programa)) {
    throw new Error('Operación no permitida.')
  }

  if (!tieneLocutorDisponible(programa.locutorCorreo)) {
    throw new Error(
      'El programa no tiene un locutor disponible asignado.',
    )
  }

  if (obtenerEmision() !== null) {
    throw new Error('Ya existe una emisión activa.')
  }

  guardarEmision({
    programaId: programa.id,
    iniciadaPor: normalizarCorreo(sesion.correo),
    inicio: new Date().toISOString(),
  })
}

export function finalizarEmision(programaId) {
  const sesion = obtenerSesionDeEmision()
  const emision = obtenerEmision()

  if (!emision || emision.programaId !== programaId) {
    throw new Error('La emisión ya no está activa.')
  }

  if (sesion.rol !== 'Administrador') {
    const programa = obtenerProgramas().find(
      (item) => item.id === programaId,
    )

    if (!puedeControlarPrograma(sesion, programa)) {
      throw new Error('Operación no permitida.')
    }
  }

  guardarEmision(null)
}