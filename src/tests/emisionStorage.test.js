import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  CLAVE_EMISION,
  EVENTO_EMISION,
  guardarEmision,
  notificarCambioEmision,
  obtenerEmision,
} from '../utils/emisionStorage.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const locutor = usuariosDemo.find(
  (usuario) => usuario.rol === 'Locutor',
)

function emisionPrueba(cambios = {}) {
  return {
    programaId: 'programa-1',
    iniciadaPor: locutor.correo,
    inicio: '2026-01-01T10:00:00.000Z',
    ...cambios,
  }
}

function prepararEmision(emision) {
  localStorage.setItem(
    CLAVE_EMISION,
    JSON.stringify(emision),
  )
}

describe('emisionStorage', () => {
  beforeEach(() => {
    localStorage.clear()

    vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    vi.restoreAllMocks()

    localStorage.clear()
  })

  describe('lectura', () => {
    it('devuelve null cuando no hay una emisión guardada', () => {
      expect(obtenerEmision()).toBeNull()

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })

    it('devuelve una emisión válida sin modificar el almacenamiento', () => {
      const emision = emisionPrueba()

      prepararEmision(emision)

      const inicial = localStorage.getItem(
        CLAVE_EMISION,
      )

      expect(
        obtenerEmision(),
      ).toEqual(emision)

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe(inicial)

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })

    it('rechaza JSON inválido sin reemplazarlo', () => {
      localStorage.setItem(
        CLAVE_EMISION,
        '{json inválido',
      )

      expect(
        () => obtenerEmision(),
      ).toThrow()

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe('{json inválido')
    })

    it.each([
      {
        caso: 'un valor null guardado',
        emision: null,
      },
      {
        caso: 'un objeto vacío',
        emision: {},
      },
      {
        caso: 'un identificador numérico',
        emision: emisionPrueba({
          programaId: 1,
        }),
      },
      {
        caso: 'un identificador vacío',
        emision: emisionPrueba({
          programaId: ' ',
        }),
      },
      {
        caso: 'un iniciador que no es texto',
        emision: emisionPrueba({
          iniciadaPor: null,
        }),
      },
      {
        caso: 'un correo incompatible con Locutor',
        emision: emisionPrueba({
          iniciadaPor: 'persona@correo.com',
        }),
      },
      {
        caso: 'una fecha que no es texto',
        emision: emisionPrueba({
          inicio: 123,
        }),
      },
      {
        caso: 'una fecha no interpretable',
        emision: emisionPrueba({
          inicio: 'fecha inválida',
        }),
      },
    ])(
      'rechaza $caso sin reemplazar los datos',
      ({ emision }) => {
        prepararEmision(emision)

        const inicial = localStorage.getItem(
          CLAVE_EMISION,
        )

        expect(
          () => obtenerEmision(),
        ).toThrow(
          'Estado de emisión inválido.',
        )

        expect(
          localStorage.getItem(CLAVE_EMISION),
        ).toBe(inicial)

        expect(
          window.dispatchEvent,
        ).not.toHaveBeenCalled()
      },
    )

    it('propaga un fallo de lectura del almacenamiento', () => {
      vi.spyOn(
        Storage.prototype,
        'getItem',
      ).mockImplementation(() => {
        throw new Error(
          'No se pudo leer el almacenamiento',
        )
      })

      expect(
        () => obtenerEmision(),
      ).toThrow(
        'No se pudo leer el almacenamiento',
      )

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })
  })

  describe('notificación', () => {
    it('emite el evento de actualización de emisión', () => {
      notificarCambioEmision()

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })
  })

  describe('guardado y eliminación', () => {
    it('guarda una emisión y notifica el cambio', () => {
      const emision = emisionPrueba()

      guardarEmision(emision)

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe(JSON.stringify(emision))

      expect(
        obtenerEmision(),
      ).toEqual(emision)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('reemplaza una emisión anterior al guardar otra', () => {
      prepararEmision(emisionPrueba())

      const nueva = emisionPrueba({
        programaId: 'programa-2',
        inicio: '2026-01-02T10:00:00.000Z',
      })

      guardarEmision(nueva)

      expect(
        obtenerEmision(),
      ).toEqual(nueva)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledTimes(1)
    })

    it('elimina la clave de emisión al guardar null y conserva otras claves', () => {
      prepararEmision(emisionPrueba())

      localStorage.setItem(
        'clave-ajena',
        'datos a conservar',
      )

      guardarEmision(null)

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBeNull()

      expect(
        obtenerEmision(),
      ).toBeNull()

      expect(
        localStorage.getItem('clave-ajena'),
      ).toBe('datos a conservar')

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('permite guardar null aunque no exista una emisión previa', () => {
      expect(
        () => guardarEmision(null),
      ).not.toThrow()

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBeNull()

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledTimes(1)
    })

    it('propaga un fallo de escritura sin notificar éxito ni reemplazar la emisión anterior', () => {
      const anterior = emisionPrueba()

      prepararEmision(anterior)

      vi.spyOn(
        Storage.prototype,
        'setItem',
      ).mockImplementation(() => {
        throw new Error(
          'No se pudo guardar la emisión',
        )
      })

      expect(
        () =>
          guardarEmision(
            emisionPrueba({
              programaId: 'programa-2',
            }),
          ),
      ).toThrow(
        'No se pudo guardar la emisión',
      )

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe(JSON.stringify(anterior))

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })

    it('propaga un fallo de eliminación sin notificar éxito ni perder la emisión guardada', () => {
      const anterior = emisionPrueba()

      prepararEmision(anterior)

      vi.spyOn(
        Storage.prototype,
        'removeItem',
      ).mockImplementation(() => {
        throw new Error(
          'No se pudo eliminar la emisión',
        )
      })

      expect(
        () => guardarEmision(null),
      ).toThrow(
        'No se pudo eliminar la emisión',
      )

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe(JSON.stringify(anterior))

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })
  })
})