import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react'

import useEmision from '../hooks/useEmision.js'

import {
  CLAVE_EMISION,
  EVENTO_EMISION,
  guardarEmision,
} from '../utils/emisionStorage.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const CLAVE_PROGRAMAS = 'jugoseoProgramas'

const locutor = usuariosDemo.find(
  (usuario) => usuario.rol === 'Locutor',
)

function programaPrueba(cambios = {}) {
  return {
    id: 'programa-1',
    nombre: 'Programa de prueba',
    conductor: 'Conductora de prueba',
    horarioDetalle: 'Lunes de 10:00 a 11:00',
    imagen: 'programa.jpg',
    descripcion: 'Descripción del programa.',
    parrafos: ['Primer párrafo.'],
    caracteristicas: ['Música y conversación.'],
    locutorCorreo: locutor.correo,
    ...cambios,
  }
}

function emisionPrueba(cambios = {}) {
  return {
    programaId: 'programa-1',
    iniciadaPor: locutor.correo,
    inicio: '2026-01-01T10:00:00.000Z',
    ...cambios,
  }
}

function prepararProgramas(programas) {
  localStorage.setItem(
    CLAVE_PROGRAMAS,
    JSON.stringify(programas),
  )
}

function prepararEmision(emision) {
  localStorage.setItem(
    CLAVE_EMISION,
    JSON.stringify(emision),
  )
}

function emitirEventoStorage(clave) {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: clave,
    }),
  )
}

describe('useEmision', () => {
  beforeEach(() => {
    localStorage.clear()

    prepararProgramas([
      programaPrueba(),
    ])
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('devuelve un estado sin emisión ni programa cuando no existe una emisión activa', () => {
    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error: '',
    })
  })

  it('no consulta el catálogo si no existe una emisión activa', () => {
    localStorage.setItem(
      CLAVE_PROGRAMAS,
      '{catálogo inválido',
    )

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error: '',
    })
  })

  it('devuelve la emisión activa y selecciona su programa dentro del catálogo', () => {
    const programa = programaPrueba()
    const emision = emisionPrueba()

    prepararProgramas([
      programaPrueba({
        id: 'otro-programa',
        nombre: 'Otro programa',
      }),
      programa,
    ])

    prepararEmision(emision)

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision,
      programa,
      error: '',
    })
  })

  it('conserva la emisión y devuelve programa null si su identificador no está en el catálogo', () => {
    const emision = emisionPrueba({
      programaId: 'programa-inexistente',
    })

    prepararEmision(emision)

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision,
      programa: null,
      error: '',
    })
  })

  it('informa un error cuando la emisión guardada contiene JSON inválido', () => {
    localStorage.setItem(
      CLAVE_EMISION,
      '{emisión inválida',
    )

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error:
        'No se pudo consultar el estado de emisión.',
    })

    expect(
      localStorage.getItem(CLAVE_EMISION),
    ).toBe('{emisión inválida')
  })

  it('informa un error cuando existe una emisión pero el catálogo es inválido', () => {
    prepararEmision(emisionPrueba())

    localStorage.setItem(
      CLAVE_PROGRAMAS,
      '{}',
    )

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error:
        'No se pudo consultar el estado de emisión.',
    })
  })

  it('actualiza el estado al guardar y eliminar una emisión mediante el evento del módulo', () => {
    const { result } = renderHook(
      () => useEmision(),
    )

    const emision = emisionPrueba()

    act(() => {
      guardarEmision(emision)
    })

    expect(result.current).toEqual({
      emision,
      programa: programaPrueba(),
      error: '',
    })

    act(() => {
      guardarEmision(null)
    })

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error: '',
    })
  })

  it.each([
    CLAVE_EMISION,
    CLAVE_PROGRAMAS,
    null,
  ])(
    'recarga el estado ante un evento storage con clave %s',
    (clave) => {
      const { result } = renderHook(
        () => useEmision(),
      )

      const emision = emisionPrueba()

      prepararEmision(emision)

      act(() => {
        emitirEventoStorage(clave)
      })

      expect(result.current).toEqual({
        emision,
        programa: programaPrueba(),
        error: '',
      })
    },
  )

  it('ignora eventos storage correspondientes a claves ajenas', () => {
    const { result } = renderHook(
      () => useEmision(),
    )

    const estadoAnterior = result.current

    prepararEmision(emisionPrueba())

    act(() => {
      emitirEventoStorage('clave-ajena')
    })

    expect(
      result.current,
    ).toBe(estadoAnterior)

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error: '',
    })
  })

  it('actualiza los datos del programa cuando cambia el catálogo', () => {
    const emision = emisionPrueba()

    prepararEmision(emision)

    const { result } = renderHook(
      () => useEmision(),
    )

    const actualizado = programaPrueba({
      nombre: 'Nombre actualizado',
      descripcion: 'Nueva descripción.',
    })

    prepararProgramas([actualizado])

    act(() => {
      emitirEventoStorage(CLAVE_PROGRAMAS)
    })

    expect(result.current).toEqual({
      emision,
      programa: actualizado,
      error: '',
    })
  })

  it('elimina el error anterior cuando los datos se corrigen y se notifica el cambio', () => {
    localStorage.setItem(
      CLAVE_EMISION,
      '{emisión inválida',
    )

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(
      result.current.error,
    ).toBe(
      'No se pudo consultar el estado de emisión.',
    )

    const emision = emisionPrueba()

    prepararEmision(emision)

    act(() => {
      window.dispatchEvent(
        new Event(EVENTO_EMISION),
      )
    })

    expect(result.current).toEqual({
      emision,
      programa: programaPrueba(),
      error: '',
    })
  })

  it('refleja un error de lectura que aparece después de la carga inicial', () => {
    prepararEmision(emisionPrueba())

    const { result } = renderHook(
      () => useEmision(),
    )

    expect(result.current.error).toBe('')

    localStorage.setItem(
      CLAVE_EMISION,
      '{}',
    )

    act(() => {
      window.dispatchEvent(
        new Event(EVENTO_EMISION),
      )
    })

    expect(result.current).toEqual({
      emision: null,
      programa: null,
      error:
        'No se pudo consultar el estado de emisión.',
    })
  })

  it('retira los listeners de emisión y storage al desmontar el hook', () => {
    const agregarListener = vi.spyOn(
      window,
      'addEventListener',
    )

    const retirarListener = vi.spyOn(
      window,
      'removeEventListener',
    )

    const { unmount } = renderHook(
      () => useEmision(),
    )

    const registroEmision =
      agregarListener.mock.calls.find(
        ([evento]) =>
          evento === EVENTO_EMISION,
      )

    const registroStorage =
      agregarListener.mock.calls.find(
        ([evento]) =>
          evento === 'storage',
      )

    expect(
      registroEmision,
    ).toBeDefined()

    expect(
      registroStorage,
    ).toBeDefined()

    unmount()

    expect(
      retirarListener,
    ).toHaveBeenCalledWith(
      EVENTO_EMISION,
      registroEmision[1],
    )

    expect(
      retirarListener,
    ).toHaveBeenCalledWith(
      'storage',
      registroStorage[1],
    )
  })
})