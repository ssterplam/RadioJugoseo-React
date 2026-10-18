import { usuariosDemo } from '../data/usuariosDemo.js'
import { leerSesion } from '../data/sesion.js'

import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'

import {
  validarEdicionUsuario,  
  validarUsuarioInterno,
} from './validacionesUsuario.js'

import {
  CLAVE_USUARIOS,
  EVENTO_USUARIOS,
  leerUsuariosLocales,
} from './cuentasLectura.js'

import {
  obtenerProgramas,
} from './programasStorage.js'

import {
  obtenerEmision,
} from './emisionStorage.js'

function exigirAdministrador() {
  const sesion = leerSesion()

  if (!sesion || sesion.rol !== 'Administrador') {
    throw new Error('Operación no permitida.')
  }
}

function leerRegistrados() {
   return leerUsuariosLocales() 
}

function construirListado(registrados) {
  const cuentas = [
    ...usuariosDemo.map((usuario) => ({
      cuenta: usuario,
      origen: 'Demostración',
    })),
    ...registrados.map((usuario) => ({
      cuenta: usuario,
      origen: 'Local',
    })),
  ]

  return cuentas.map(({ cuenta, origen }) => {
    const correo = normalizarCorreo(cuenta.correo)
    const rol = cuenta.rol || 'Cliente'

    return {
      correo,
      nombre: String(cuenta.nombre || ''),
      apellido: String(cuenta.apellido || ''),
      rol,
      tipo: cuenta.tipo || null,
      fechaCreacion: cuenta.fechaCreacion || null,
      origen,
      requiereRevision: Boolean(
        validarCorreoParaRol(correo, rol),
      ),
    }
  })
}

export function obtenerUsuariosAdministrables() {
  exigirAdministrador()

  return construirListado(leerRegistrados())
}

export function crearUsuarioInterno(datos) {
  exigirAdministrador()

  const registrados = leerRegistrados()
  const usuarios = construirListado(registrados)

  const errores = validarUsuarioInterno(
    datos,
    usuarios,
  )

  if (Object.keys(errores).length > 0) {
    throw new Error('Los datos ingresados no son válidos.')
  }

  const nuevoUsuario = {
    id: `usuario-${crypto.randomUUID()}`,
    versionCuenta: 0,
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    correo: normalizarCorreo(datos.correo),
    rol: datos.rol,
    password: datos.password,
    tipo: null,
    run: null,
    region: null,
    comuna: null,
    fechaNacimiento: null,
    direccion: null,
    fechaCreacion: new Date().toISOString(),
  }

  const actualizados = [
    ...registrados,
    nuevoUsuario,
  ]

  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(actualizados),
  )

  window.dispatchEvent(new Event(EVENTO_USUARIOS))

  return construirListado(actualizados)
}

function rechazarUsuario(codigo) {
  const error = new Error('Operación no permitida.')
  error.codigo = codigo
  throw error
}

function obtenerObjetivoEditable(correoIngresado) {
  exigirAdministrador()

  const sesion = leerSesion()
  const correo = normalizarCorreo(correoIngresado)

  if (
    !sesion ||
    usuariosDemo.some(
      (usuario) =>
        normalizarCorreo(usuario.correo) === correo,
    ) ||
    normalizarCorreo(sesion.correo) === correo
  ) {
    rechazarUsuario('CUENTA_PROTEGIDA')
  }

  const registrados = leerRegistrados()

  const coincidencias = registrados.filter(
    (usuario) =>
      normalizarCorreo(usuario.correo) === correo,
  )

  if (coincidencias.length !== 1) {
    rechazarUsuario('CUENTA_NO_DISPONIBLE')
  }

  return {
    registrados,
    cuenta: coincidencias[0],
    correo,
  }
}

function exigirSinVinculos(correo) {
  const emision = obtenerEmision()
  const programas = obtenerProgramas()

  if (
    emision &&
    normalizarCorreo(emision.iniciadaPor) === correo
  ) {
    rechazarUsuario('EMISION_ACTIVA')
  }

  if (
    programas.some(
      (programa) =>
        normalizarCorreo(programa.locutorCorreo) === correo,
    )
  ) {
    rechazarUsuario('USUARIO_ASIGNADO')
  }
}

export function actualizarUsuario(correoIngresado, datos) {
  const {
    registrados,
    cuenta,
    correo,
  } = obtenerObjetivoEditable(correoIngresado)

  const usuarioParaValidar = {
    ...cuenta,
    correo,
    rol: cuenta.rol || 'Cliente',
  }

  const errores = validarEdicionUsuario(
    datos,
    usuarioParaValidar,
  )

  if (Object.keys(errores).length > 0) {
    rechazarUsuario('DATOS_INVALIDOS')
  }

  if (datos.rol !== usuarioParaValidar.rol) {
    exigirSinVinculos(correo)
  }

  const versionActual = cuenta.versionCuenta ?? 0

  if (
    !Number.isSafeInteger(versionActual) ||
    versionActual < 0 ||
    !Number.isSafeInteger(versionActual + 1)
  ) {
    rechazarUsuario('DATOS_INVALIDOS')
  }

  const actualizados = registrados.map((usuario) =>
    normalizarCorreo(usuario.correo) === correo
      ? {
          ...usuario,
          id: usuario.id || `usuario-${crypto.randomUUID()}`,
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          rol: datos.rol,
          tipo: datos.rol === 'Cliente' ? datos.tipo : null,
          password: datos.password || usuario.password,
          versionCuenta: versionActual + 1,
        }
      : usuario,
  )

  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(actualizados),
  )

  window.dispatchEvent(new Event(EVENTO_USUARIOS))

  return construirListado(actualizados)
}

export function eliminarUsuario(correoIngresado) {
  const {
    registrados,
    correo,
  } = obtenerObjetivoEditable(correoIngresado)

  exigirSinVinculos(correo)

  const actualizados = registrados.filter(
    (usuario) =>
      normalizarCorreo(usuario.correo) !== correo,
  )

  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(actualizados),
  )

  window.dispatchEvent(new Event(EVENTO_USUARIOS))

  return construirListado(actualizados)
}