import { usuariosDemo } from '../data/usuariosDemo.js'
import { leerSesion } from '../data/sesion.js'

import {
  normalizarCorreo,
  validarCorreoParaRol,
} from './validacionesCorreo.js'

import {
  validarUsuarioInterno,
} from './validacionesUsuario.js'

const CLAVE_USUARIOS = 'jugoseoRadioescuchas'

function exigirAdministrador() {
  const sesion = leerSesion()

  if (!sesion || sesion.rol !== 'Administrador') {
    throw new Error('Operación no permitida.')
  }
}

function leerRegistrados() {
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

  return construirListado(actualizados)
}