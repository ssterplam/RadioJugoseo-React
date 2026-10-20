import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  eliminarSesion,
  leerSesion,
} from '../data/sesion.js'

import {
  CLAVE_USUARIOS,
} from '../utils/cuentasLectura.js'

const CLAVE_SESION = 'jugoseoUsuario'

const cuentaLocal = {
  id: 'cuenta-sesion-prueba',
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: 'cuenta.unitaria@gmail.com',
  rol: 'Cliente',
  tipo: 'Radioescucha Oficial',
  versionCuenta: 2,
}

function guardarCuenta(cambios = {}) {
  const cuenta = {
    ...cuentaLocal,
    ...cambios,
  }

  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify([cuenta]),
  )

  return cuenta
}

function guardarSesion(cambios = {}) {
  const sesion = {
    usuario: 'Nombre anterior',
    correo: cuentaLocal.correo,
    rol: cuentaLocal.rol,
    cuentaId: cuentaLocal.id,
    versionCuenta: cuentaLocal.versionCuenta,
    ...cambios,
  }

  sessionStorage.setItem(
    CLAVE_SESION,
    JSON.stringify(sesion),
  )

  return sesion
}

function comprobarSesionEliminada() {
  expect(
    sessionStorage.getItem(CLAVE_SESION),
  ).toBeNull()
}

describe('sesion', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('devuelve null cuando no existe sesión', () => {
    expect(leerSesion()).toBeNull()
  })

  it('valida una cuenta local y actualiza nombre, correo y tipo desde la cuenta', () => {
    guardarCuenta()

    guardarSesion({
      correo: '  CUENTA.UNITARIA@GMAIL.COM  ',
      tipo: 'Tipo anterior',
    })

    expect(leerSesion()).toEqual({
      usuario: 'Ana Pérez',
      correo: 'cuenta.unitaria@gmail.com',
      rol: 'Cliente',
      cuentaId: 'cuenta-sesion-prueba',
      versionCuenta: 2,
      tipo: 'Radioescucha Oficial',
    })
  })

  it('acepta una cuenta demo sin identificador ni versión y devuelve tipo null', () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        correo: 'ADMIN@JUGOSEO.COM',
        rol: 'Administrador',
      }),
    )

    expect(leerSesion()).toEqual({
      usuario: 'Administrador Sistema',
      correo: 'admin@jugoseo.com',
      rol: 'Administrador',
      tipo: null,
    })
  })

  it('utiliza los valores predeterminados de una cuenta sin rol, identificador, versión ni apellido', () => {
    localStorage.setItem(
      CLAVE_USUARIOS,
      JSON.stringify([
        {
          correo: cuentaLocal.correo,
          nombre: 'Ana',
        },
      ]),
    )

    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        correo: cuentaLocal.correo,
        rol: 'Cliente',
      }),
    )

    expect(leerSesion()).toEqual({
      usuario: 'Ana',
      correo: cuentaLocal.correo,
      rol: 'Cliente',
      tipo: null,
    })
  })

  it.each([
    {
      caso: 'sesión null',
      datos: null,
    },
    {
      caso: 'sesión sin correo',
      datos: {},
    },
    {
      caso: 'correo que no es texto',
      datos: { correo: 123 },
    },
  ])(
    'elimina una $caso',
    ({ datos }) => {
      sessionStorage.setItem(
        CLAVE_SESION,
        JSON.stringify(datos),
      )

      expect(leerSesion()).toBeNull()

      comprobarSesionEliminada()
    },
  )

  it('elimina una sesión con JSON inválido', () => {
    sessionStorage.setItem(
      CLAVE_SESION,
      '{json inválido',
    )

    expect(leerSesion()).toBeNull()

    comprobarSesionEliminada()
  })

  it('elimina la sesión cuando la cuenta ya no existe', () => {
    guardarSesion()

    expect(leerSesion()).toBeNull()

    comprobarSesionEliminada()
  })

  it.each([
    {
      caso: 'el rol',
      cambios: {
        rol: 'Administrador',
      },
    },
    {
      caso: 'el identificador',
      cambios: {
        cuentaId: 'otra-cuenta',
      },
    },
    {
      caso: 'la versión',
      cambios: {
        versionCuenta: 99,
      },
    },
  ])(
    'invalida la sesión si no coincide $caso de la cuenta',
    ({ cambios }) => {
      guardarCuenta()
      guardarSesion(cambios)

      expect(leerSesion()).toBeNull()

      comprobarSesionEliminada()
    },
  )

  it.each([
    {
      caso: 'negativa',
      version: -1,
    },
    {
      caso: 'decimal',
      version: 1.5,
    },
    {
      caso: 'de tipo texto',
      version: '2',
    },
  ])(
    'rechaza una versión $caso aunque coincida entre cuenta y sesión',
    ({ version }) => {
      guardarCuenta({
        versionCuenta: version,
      })

      guardarSesion({
        versionCuenta: version,
      })

      expect(leerSesion()).toBeNull()

      comprobarSesionEliminada()
    },
  )

  it('rechaza una cuenta sin nombre utilizable', () => {
    guardarCuenta({
      nombre: null,
      apellido: 123,
    })

    guardarSesion()

    expect(leerSesion()).toBeNull()

    comprobarSesionEliminada()
  })

  it('rechaza una cuenta con rol incompatible con su correo', () => {
    guardarCuenta({
      rol: 'Locutor',
    })

    guardarSesion({
      rol: 'Locutor',
    })

    expect(leerSesion()).toBeNull()

    comprobarSesionEliminada()
  })

  it('elimina la sesión si falla la lectura de cuentas locales', () => {
    guardarSesion()

    localStorage.setItem(
      CLAVE_USUARIOS,
      '{usuarios inválidos',
    )

    expect(leerSesion()).toBeNull()

    comprobarSesionEliminada()
  })

  it('elimina la sesión y devuelve true sin borrar otras claves', () => {
    guardarSesion()

    sessionStorage.setItem(
      'otraClave',
      'conservar',
    )

    expect(eliminarSesion()).toBe(true)

    comprobarSesionEliminada()

    expect(
      sessionStorage.getItem('otraClave'),
    ).toBe('conservar')
  })

  it('devuelve false si el almacenamiento impide eliminar la sesión', () => {
    guardarSesion()

    vi.spyOn(
      Storage.prototype,
      'removeItem',
    ).mockImplementation(() => {
      throw new Error('Eliminación bloqueada')
    })

    expect(eliminarSesion()).toBe(false)

    expect(
      sessionStorage.getItem(CLAVE_SESION),
    ).not.toBeNull()
  })

  it('devuelve null si no se puede leer el almacenamiento de sesión', () => {
    vi.spyOn(
      Storage.prototype,
      'getItem',
    ).mockImplementation(() => {
      throw new Error('Lectura bloqueada')
    })

    expect(leerSesion()).toBeNull()
  })
})