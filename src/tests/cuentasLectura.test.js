import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  buscarCuentaPorCorreo,
  CLAVE_USUARIOS,
  leerUsuariosLocales,
} from '../utils/cuentasLectura.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const cuentaLocal = {
  id: 'cuenta-local-prueba',
  nombre: 'Ana',
  apellido: 'Pérez',
  correo: 'cuenta.unitaria@gmail.com',
  rol: 'Cliente',
  tipo: 'Radioescucha Oficial',
  versionCuenta: 2,
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(usuarios),
  )
}

describe('cuentasLectura', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('devuelve un listado vacío cuando no existen usuarios locales', () => {
    expect(
      leerUsuariosLocales(),
    ).toEqual([])
  })

  it('devuelve el listado local válido sin modificarlo', () => {
    guardarUsuarios([cuentaLocal])

    expect(
      leerUsuariosLocales(),
    ).toEqual([cuentaLocal])

    expect(
      JSON.parse(
        localStorage.getItem(CLAVE_USUARIOS),
      ),
    ).toEqual([cuentaLocal])
  })

  it.each([
    {
      caso: 'un objeto en lugar de un arreglo',
      datos: {},
    },
    {
      caso: 'un valor null',
      datos: null,
    },
    {
      caso: 'un usuario null',
      datos: [null],
    },
    {
      caso: 'un usuario que no es un objeto',
      datos: ['usuario inválido'],
    },
    {
      caso: 'un usuario sin correo',
      datos: [{}],
    },
    {
      caso: 'un correo que no es texto',
      datos: [{ correo: 123 }],
    },
    {
      caso: 'un correo vacío tras normalizar',
      datos: [{ correo: '   ' }],
    },
  ])(
    'rechaza $caso sin reemplazar los datos guardados',
    ({ datos }) => {
      guardarUsuarios(datos)

      const contenidoInicial =
        localStorage.getItem(CLAVE_USUARIOS)

      expect(
        () => leerUsuariosLocales(),
      ).toThrow(
        'No se pudo leer la lista de usuarios.',
      )

      expect(
        localStorage.getItem(CLAVE_USUARIOS),
      ).toBe(contenidoInicial)
    },
  )

  it('lanza un error cuando el contenido no es JSON válido', () => {
    localStorage.setItem(
      CLAVE_USUARIOS,
      '{json inválido',
    )

    expect(
      () => leerUsuariosLocales(),
    ).toThrow()

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBe('{json inválido')
  })

  it('prioriza una cuenta de demostración y normaliza el correo consultado', () => {
    const demo = usuariosDemo[0]

    guardarUsuarios([
      {
        ...cuentaLocal,
        correo: demo.correo,
      },
    ])

    expect(
      buscarCuentaPorCorreo(
        `  ${demo.correo.toUpperCase()}  `,
      ),
    ).toEqual(demo)
  })

  it('encuentra una cuenta local sin distinguir mayúsculas ni espacios externos', () => {
    guardarUsuarios([
      {
        ...cuentaLocal,
        correo: '  CUENTA.UNITARIA@GMAIL.COM  ',
      },
    ])

    const encontrada = buscarCuentaPorCorreo(
      ' cuenta.unitaria@gmail.com ',
    )

    expect(encontrada).toMatchObject({
      id: 'cuenta-local-prueba',
      nombre: 'Ana',
    })
  })

  it('devuelve null cuando la cuenta no existe', () => {
    guardarUsuarios([cuentaLocal])

    expect(
      buscarCuentaPorCorreo(
        'no.existe@gmail.com',
      ),
    ).toBeNull()
  })

  it('rechaza cuentas locales con correos duplicados tras normalizar', () => {
    guardarUsuarios([
      cuentaLocal,
      {
        ...cuentaLocal,
        id: 'otra-cuenta',
        correo: ' CUENTA.UNITARIA@GMAIL.COM ',
      },
    ])

    expect(
      () => buscarCuentaPorCorreo(
        'cuenta.unitaria@gmail.com',
      ),
    ).toThrow('Hay cuentas duplicadas.')
  })

  it('propaga el error cuando no se puede leer el almacenamiento', () => {
    vi.spyOn(
      Storage.prototype,
      'getItem',
    ).mockImplementation(() => {
      throw new Error('Lectura bloqueada')
    })

    expect(
      () => leerUsuariosLocales(),
    ).toThrow('Lectura bloqueada')
  })
})