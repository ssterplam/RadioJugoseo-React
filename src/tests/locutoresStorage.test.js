import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  obtenerLocutores,
  tieneLocutorDisponible,
} from '../utils/locutoresStorage.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const locutorDemo = usuariosDemo.find(
  (usuario) => usuario.rol === 'Locutor',
)

function usuarioLocal(cambios = {}) {
  return {
    id: 'usuario-local-1',
    versionCuenta: 0,
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana.locutora@jugoseo.com',
    rol: 'Locutor',
    password: 'clave',
    tipo: null,
    run: null,
    region: null,
    comuna: null,
    fechaNacimiento: null,
    direccion: null,
    fechaCreacion: '2026-01-01T10:00:00.000Z',
    ...cambios,
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(
    'jugoseoRadioescuchas',
    JSON.stringify(usuarios),
  )
}

describe('locutoresStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('incluye la locutora demo cuando no hay usuarios guardados', () => {
    expect(obtenerLocutores()).toEqual([{
      correo: locutorDemo.correo,
      nombre: 'María García',
    }])
  })

  it('rechaza una lista de usuarios que no es un arreglo', () => {
    localStorage.setItem(
      'jugoseoRadioescuchas',
      '{}',
    )

    expect(
      () => obtenerLocutores(),
    ).toThrow(
      'No se pudo leer la lista de usuarios.',
    )
  })

  it('incluye locutores demo y locales, normaliza correos y elimina duplicados', () => {
    guardarUsuarios([
      usuarioLocal({
        correo: '  ANA.LOCUTORA@jugoseo.com  ',
      }),
      usuarioLocal({
        id: 'usuario-local-2',
        correo: 'ana.locutora@jugoseo.com',
      }),
    ])

    const locutores = obtenerLocutores()

    const correos = locutores.map(
      (locutor) => locutor.correo,
    )

    expect(correos).toContain(
      'ana.locutora@jugoseo.com',
    )

    expect(
      correos.filter(
        (correo) =>
          correo ===
          'ana.locutora@jugoseo.com',
      ),
    ).toHaveLength(1)

    expect(
      locutores.find(
        (locutor) =>
          locutor.correo ===
          'ana.locutora@jugoseo.com',
      ),
    ).toEqual({
      correo: 'ana.locutora@jugoseo.com',
      nombre: 'Ana Pérez',
    })
  })

  it('excluye locutores con correo inválido para su rol', () => {
    guardarUsuarios([
      usuarioLocal({
        correo: 'ana@correo.com',
      }),
    ])

    const correos = obtenerLocutores().map(
      (locutor) => locutor.correo,
    )

    expect(correos).not.toContain(
      'ana@correo.com',
    )

    expect(correos).toContain(
      locutorDemo.correo,
    )
  })

  it('usa el correo como nombre cuando el usuario no tiene nombre ni apellido', () => {
    guardarUsuarios([
      usuarioLocal({
        nombre: null,
        apellido: null,
      }),
    ])

    expect(
      obtenerLocutores(),
    ).toEqual([
      {
        correo: locutorDemo.correo,
        nombre: 'María García',
      },
      {
        correo: 'ana.locutora@jugoseo.com',
        nombre: 'ana.locutora@jugoseo.com',
      },
    ])
  })

  it('verifica si un correo corresponde a un locutor disponible', () => {
    guardarUsuarios([
      usuarioLocal(),
    ])

    expect(
      tieneLocutorDisponible(
        'ana.locutora@jugoseo.com',
      ),
    ).toBe(true)

    expect(
      tieneLocutorDisponible(
        locutorDemo.correo,
      ),
    ).toBe(true)

    expect(
      tieneLocutorDisponible(
        'cliente@duocuc.cl',
      ),
    ).toBe(false)

    expect(
      tieneLocutorDisponible(''),
    ).toBe(false)
  })
})