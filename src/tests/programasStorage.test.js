import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  actualizarContenidoPrograma,
  asignarLocutor,
  cargarCatalogoProgramas,
  crearPrograma,
  eliminarPrograma,
  finalizarEmision,
  iniciarEmision,
  obtenerProgramas,
} from '../utils/programasStorage.js'

import {
  CLAVE_EMISION,
  EVENTO_EMISION,
  obtenerEmision,
} from '../utils/emisionStorage.js'

import {
  programas as programasIniciales,
} from '../data/programas.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

const CLAVE_PROGRAMAS = 'jugoseoProgramas'

const administrador = usuariosDemo.find(
  (usuario) => usuario.rol === 'Administrador',
)

const locutor = usuariosDemo.find(
  (usuario) => usuario.rol === 'Locutor',
)

const cliente = usuariosDemo.find(
  (usuario) => usuario.rol === 'Cliente',
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

function segundoPrograma(cambios = {}) {
  return programaPrueba({
    id: 'programa-2',
    nombre: 'Segundo programa',
    locutorCorreo: null,
    ...cambios,
  })
}

function datosValidos(cambios = {}) {
  return {
    nombre: '  Programa actualizado  ',
    conductor: '  Nuevo conductor  ',
    horarioDetalle: '  Martes de 12:00 a 13:00  ',
    imagen: '  nuevo.jpg  ',
    descripcion: '  Descripción actualizada.  ',
    parrafos:
      '  Primer párrafo nuevo.  \n\n Segundo párrafo nuevo. ',
    caracteristicas:
      '  Entrevistas.  \n Música en vivo. ',
    ...cambios,
  }
}

function guardarSesion(cuenta = administrador) {
  sessionStorage.setItem(
    'jugoseoUsuario',
    JSON.stringify({
      correo: cuenta.correo,
      rol: cuenta.rol,
    }),
  )
}

function guardarProgramas(programas) {
  localStorage.setItem(
    CLAVE_PROGRAMAS,
    JSON.stringify(programas),
  )
}

function leerProgramasGuardados() {
  return JSON.parse(
    localStorage.getItem(CLAVE_PROGRAMAS),
  )
}

function prepararEmision(programaId = null) {
  if (programaId === null) {
    localStorage.removeItem(CLAVE_EMISION)
    return
  }

  localStorage.setItem(
    CLAVE_EMISION,
    JSON.stringify({
      programaId,
      iniciadaPor: locutor.correo,
      inicio: '2026-01-01T10:00:00.000Z',
    }),
  )
}

describe('programasStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()

    guardarSesion()
    guardarProgramas([
      programaPrueba(),
      segundoPrograma(),
    ])

    prepararEmision()

    vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    vi.restoreAllMocks()

    localStorage.clear()
    sessionStorage.clear()
  })

  describe('lectura del catálogo', () => {
    it('devuelve copias de los programas iniciales sin asignación cuando no hay catálogo guardado', () => {
      localStorage.removeItem(CLAVE_PROGRAMAS)

      const resultado = obtenerProgramas()

      expect(resultado).toEqual(
        programasIniciales.map((programa) => ({
          ...programa,
          parrafos: [...programa.parrafos],
          caracteristicas: [
            ...programa.caracteristicas,
          ],
          locutorCorreo: null,
        })),
      )

      expect(resultado).not.toBe(
        programasIniciales,
      )

      resultado.forEach((programa, indice) => {
        expect(programa).not.toBe(
          programasIniciales[indice],
        )

        expect(programa.parrafos).not.toBe(
          programasIniciales[indice].parrafos,
        )

        expect(
          programa.caracteristicas,
        ).not.toBe(
          programasIniciales[indice]
            .caracteristicas,
        )
      })

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBeNull()
    })

    it('respeta un catálogo vacío guardado', () => {
      guardarProgramas([])

      expect(obtenerProgramas()).toEqual([])

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe('[]')
    })

    it('devuelve el catálogo guardado con programas asignados y sin asignar', () => {
      expect(obtenerProgramas()).toEqual([
        programaPrueba(),
        segundoPrograma(),
      ])
    })

    it.each([
      {
        caso: 'un objeto en vez de una lista',
        datos: {},
      },
      {
        caso: 'un programa null',
        datos: [null],
      },
      {
        caso: 'un nombre vacío',
        datos: [
          programaPrueba({ nombre: ' ' }),
        ],
      },
      {
        caso: 'párrafos que no son una lista',
        datos: [
          programaPrueba({ parrafos: null }),
        ],
      },
      {
        caso: 'una característica vacía',
        datos: [
          programaPrueba({
            caracteristicas: [''],
          }),
        ],
      },
      {
        caso: 'un correo incompatible con Locutor',
        datos: [
          programaPrueba({
            locutorCorreo: 'persona@correo.com',
          }),
        ],
      },
    ])(
      'rechaza $caso sin reemplazar los datos guardados',
      ({ datos }) => {
        guardarProgramas(datos)

        const inicial = localStorage.getItem(
          CLAVE_PROGRAMAS,
        )

        expect(
          () => obtenerProgramas(),
        ).toThrow(
          'Los datos de programas no son válidos.',
        )

        expect(
          localStorage.getItem(CLAVE_PROGRAMAS),
        ).toBe(inicial)
      },
    )

    it('rechaza identificadores repetidos', () => {
      guardarProgramas([
        programaPrueba(),
        programaPrueba(),
      ])

      expect(
        () => obtenerProgramas(),
      ).toThrow(
        'Hay identificadores de programa repetidos.',
      )
    })

    it('carga correctamente el catálogo y devuelve un error vacío', () => {
      expect(
        cargarCatalogoProgramas(),
      ).toEqual({
        programas: [
          programaPrueba(),
          segundoPrograma(),
        ],
        error: '',
      })
    })

    it('informa un error de carga ante JSON inválido sin reemplazarlo', () => {
      localStorage.setItem(
        CLAVE_PROGRAMAS,
        '{json inválido',
      )

      expect(
        cargarCatalogoProgramas(),
      ).toEqual({
        programas: [],
        error:
          'No se pudieron cargar los programas. Inténtalo nuevamente.',
      })

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe('{json inválido')
    })
  })

  describe('permisos administrativos', () => {
    it.each([
      {
        caso: 'sin sesión',
        cuenta: null,
      },
      {
        caso: 'con sesión de Cliente',
        cuenta: cliente,
      },
      {
        caso: 'con sesión de Locutor',
        cuenta: locutor,
      },
    ])(
      'impide crear, eliminar y asignar programas $caso',
      ({ cuenta }) => {
        sessionStorage.clear()

        if (cuenta) {
          guardarSesion(cuenta)
        }

        const inicial = localStorage.getItem(
          CLAVE_PROGRAMAS,
        )

        expect(
          () => crearPrograma(datosValidos()),
        ).toThrow('Operación no permitida.')

        expect(
          () => eliminarPrograma('programa-1'),
        ).toThrow('Operación no permitida.')

        expect(
          () =>
            asignarLocutor(
              'programa-1',
              locutor.correo,
            ),
        ).toThrow('Operación no permitida.')

        expect(
          localStorage.getItem(CLAVE_PROGRAMAS),
        ).toBe(inicial)
      },
    )
  })

  describe('asignación de locutores', () => {
    it('asigna un locutor disponible normalizando el correo y conserva los demás programas', () => {
      const resultado = asignarLocutor(
        'programa-2',
        `  ${locutor.correo.toUpperCase()}  `,
      )

      expect(resultado[0]).toEqual(
        programaPrueba(),
      )

      expect(
        resultado[1].locutorCorreo,
      ).toBe(locutor.correo)

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)
    })

    it('permite quitar la asignación usando un correo vacío', () => {
      const resultado = asignarLocutor(
        'programa-1',
        ' ',
      )

      expect(
        resultado[0].locutorCorreo,
      ).toBeNull()

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)
    })

    it('rechaza asignar un locutor inexistente', () => {
      expect(
        () =>
          asignarLocutor(
            'programa-1',
            'inexistente@jugoseo.com',
          ),
      ).toThrow(
        'El locutor seleccionado no está disponible.',
      )
    })

    it('rechaza asignar un programa inexistente', () => {
      expect(
        () =>
          asignarLocutor(
            'programa-inexistente',
            locutor.correo,
          ),
      ).toThrow(
        'El programa no está disponible.',
      )
    })

    it('impide reasignar el programa que está en emisión', () => {
      prepararEmision('programa-1')

      const inicial = localStorage.getItem(
        CLAVE_PROGRAMAS,
      )

      expect(
        () =>
          asignarLocutor(
            'programa-1',
            '',
          ),
      ).toThrow(
        'Finaliza la emisión antes de reasignar el programa.',
      )

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe(inicial)
    })
  })

  describe('creación y edición', () => {
    it('crea un programa sin locutor, normaliza campos y notifica el cambio', () => {
      const resultado = crearPrograma(
        datosValidos(),
      )

      expect(resultado).toHaveLength(3)

      expect(resultado[0]).toEqual(
        programaPrueba(),
      )

      expect(resultado[1]).toEqual(
        segundoPrograma(),
      )

      expect(resultado[2]).toEqual({
        id: expect.stringMatching(/^programa-/),
        nombre: 'Programa actualizado',
        conductor: 'Nuevo conductor',
        horarioDetalle:
          'Martes de 12:00 a 13:00',
        imagen: 'nuevo.jpg',
        descripcion:
          'Descripción actualizada.',
        parrafos: [
          'Primer párrafo nuevo.',
          'Segundo párrafo nuevo.',
        ],
        caracteristicas: [
          'Entrevistas.',
          'Música en vivo.',
        ],
        locutorCorreo: null,
      })

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('genera otro identificador si el primero ya existe', () => {
      guardarProgramas([
        programaPrueba({
          id: 'programa-repetido',
        }),
      ])

      const generarId = vi.spyOn(
        crypto,
        'randomUUID',
      )

      generarId
        .mockReturnValueOnce('repetido')
        .mockReturnValueOnce('nuevo')

      const resultado = crearPrograma(
        datosValidos(),
      )

      expect(
        generarId,
      ).toHaveBeenCalledTimes(2)

      expect(resultado[1].id).toBe(
        'programa-nuevo',
      )
    })

    it('rechaza crear con datos inválidos sin modificar el catálogo', () => {
      const inicial = localStorage.getItem(
        CLAVE_PROGRAMAS,
      )

      expect(
        () =>
          crearPrograma(
            datosValidos({ nombre: '' }),
          ),
      ).toThrow(
        'Los datos ingresados no son válidos.',
      )

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe(inicial)
    })

    it('permite al administrador editar todos los campos conservando identificador y asignación', () => {
      const resultado =
        actualizarContenidoPrograma(
          'programa-1',
          datosValidos(),
        )

      expect(resultado[0]).toEqual({
        id: 'programa-1',
        nombre: 'Programa actualizado',
        conductor: 'Nuevo conductor',
        horarioDetalle:
          'Martes de 12:00 a 13:00',
        imagen: 'nuevo.jpg',
        descripcion:
          'Descripción actualizada.',
        parrafos: [
          'Primer párrafo nuevo.',
          'Segundo párrafo nuevo.',
        ],
        caracteristicas: [
          'Entrevistas.',
          'Música en vivo.',
        ],
        locutorCorreo: locutor.correo,
      })

      expect(resultado[1]).toEqual(
        segundoPrograma(),
      )

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('permite al locutor editar contenido propio pero no nombre, conductor ni horario', () => {
      guardarSesion(locutor)

      const resultado =
        actualizarContenidoPrograma(
          'programa-1',
          datosValidos(),
        )

      expect(resultado[0]).toEqual({
        ...programaPrueba(),
        imagen: 'nuevo.jpg',
        descripcion:
          'Descripción actualizada.',
        parrafos: [
          'Primer párrafo nuevo.',
          'Segundo párrafo nuevo.',
        ],
        caracteristicas: [
          'Entrevistas.',
          'Música en vivo.',
        ],
      })

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)
    })

    it('impide al locutor editar un programa que no tiene asignado', () => {
      guardarSesion(locutor)

      expect(
        () =>
          actualizarContenidoPrograma(
            'programa-2',
            datosValidos(),
          ),
      ).toThrow('Operación no permitida.')
    })

    it.each([
      {
        caso: 'sin sesión',
        cuenta: null,
      },
      {
        caso: 'con sesión de Cliente',
        cuenta: cliente,
      },
    ])(
      'impide editar contenido $caso',
      ({ cuenta }) => {
        sessionStorage.clear()

        if (cuenta) {
          guardarSesion(cuenta)
        }

        expect(
          () =>
            actualizarContenidoPrograma(
              'programa-1',
              datosValidos(),
            ),
        ).toThrow('Operación no permitida.')
      },
    )

    it('rechaza editar un programa inexistente', () => {
      expect(
        () =>
          actualizarContenidoPrograma(
            'programa-inexistente',
            datosValidos(),
          ),
      ).toThrow(
        'El programa no está disponible.',
      )
    })

    it('rechaza una edición con datos inválidos sin modificar el catálogo', () => {
      const inicial = localStorage.getItem(
        CLAVE_PROGRAMAS,
      )

      expect(
        () =>
          actualizarContenidoPrograma(
            'programa-1',
            datosValidos({
              imagen: 'carpeta/imagen.jpg',
            }),
          ),
      ).toThrow(
        'Los datos ingresados no son válidos.',
      )

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe(inicial)
    })

    it('propaga un fallo de escritura sin informar una creación exitosa', () => {
      const inicial = localStorage.getItem(
        CLAVE_PROGRAMAS,
      )

      vi.spyOn(
        Storage.prototype,
        'setItem',
      ).mockImplementation(() => {
        throw new Error(
          'Almacenamiento no disponible',
        )
      })

      expect(
        () => crearPrograma(datosValidos()),
      ).toThrow(
        'Almacenamiento no disponible',
      )

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe(inicial)

      expect(
        window.dispatchEvent,
      ).not.toHaveBeenCalled()
    })
  })

  describe('eliminación', () => {
    it('elimina un programa inactivo y conserva los demás', () => {
      const resultado = eliminarPrograma(
        'programa-1',
      )

      expect(resultado).toEqual([
        segundoPrograma(),
      ])

      expect(
        leerProgramasGuardados(),
      ).toEqual(resultado)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('rechaza eliminar el programa activo sin modificar el catálogo', () => {
      prepararEmision('programa-1')

      const inicial = localStorage.getItem(
        CLAVE_PROGRAMAS,
      )

      expect(
        () => eliminarPrograma('programa-1'),
      ).toThrow(
        'No se puede eliminar un programa activo.',
      )

      expect(
        localStorage.getItem(CLAVE_PROGRAMAS),
      ).toBe(inicial)
    })

    it('rechaza eliminar un programa inexistente', () => {
      expect(
        () =>
          eliminarPrograma(
            'programa-inexistente',
          ),
      ).toThrow(
        'El programa no está disponible.',
      )
    })
  })

  describe('control de emisión', () => {
    it.each([
      {
        caso: 'sin sesión',
        cuenta: null,
      },
      {
        caso: 'con sesión de Cliente',
        cuenta: cliente,
      },
    ])(
      'impide iniciar y finalizar una emisión $caso',
      ({ cuenta }) => {
        sessionStorage.clear()

        if (cuenta) {
          guardarSesion(cuenta)
        }

        expect(
          () => iniciarEmision('programa-1'),
        ).toThrow('Operación no permitida.')

        expect(
          () => finalizarEmision('programa-1'),
        ).toThrow('Operación no permitida.')
      },
    )

    it('permite al locutor iniciar la emisión de su programa', () => {
      guardarSesion(locutor)

      iniciarEmision('programa-1')

      const emision = obtenerEmision()

      expect(emision).toEqual({
        programaId: 'programa-1',
        iniciadaPor: locutor.correo,
        inicio: expect.any(String),
      })

      expect(
        Number.isNaN(
          Date.parse(emision.inicio),
        ),
      ).toBe(false)

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('permite al administrador iniciar un programa con locutor disponible', () => {
      iniciarEmision('programa-1')

      expect(
        obtenerEmision(),
      ).toEqual({
        programaId: 'programa-1',
        iniciadaPor: administrador.correo,
        inicio: expect.any(String),
      })
    })

    it('rechaza iniciar un programa inexistente', () => {
      expect(
        () =>
          iniciarEmision(
            'programa-inexistente',
          ),
      ).toThrow('Operación no permitida.')
    })

    it('impide al locutor iniciar un programa que no tiene asignado', () => {
      guardarSesion(locutor)

      expect(
        () => iniciarEmision('programa-2'),
      ).toThrow('Operación no permitida.')
    })

    it('impide iniciar un programa sin locutor disponible', () => {
      expect(
        () => iniciarEmision('programa-2'),
      ).toThrow(
        'El programa no tiene un locutor disponible asignado.',
      )

      guardarProgramas([
        programaPrueba({
          locutorCorreo:
            'inexistente@jugoseo.com',
        }),
      ])

      expect(
        () => iniciarEmision('programa-1'),
      ).toThrow(
        'El programa no tiene un locutor disponible asignado.',
      )
    })

    it('impide iniciar otra emisión cuando ya existe una activa', () => {
      prepararEmision('programa-2')

      const inicial = localStorage.getItem(
        CLAVE_EMISION,
      )

      expect(
        () => iniciarEmision('programa-1'),
      ).toThrow(
        'Ya existe una emisión activa.',
      )

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBe(inicial)
    })

    it('permite al locutor finalizar la emisión de su programa', () => {
      guardarSesion(locutor)
      prepararEmision('programa-1')

      finalizarEmision('programa-1')

      expect(obtenerEmision()).toBeNull()

      expect(
        localStorage.getItem(CLAVE_EMISION),
      ).toBeNull()

      expect(
        window.dispatchEvent,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTO_EMISION,
        }),
      )
    })

    it('permite al administrador finalizar una emisión', () => {
      prepararEmision('programa-1')

      finalizarEmision('programa-1')

      expect(obtenerEmision()).toBeNull()
    })

    it('rechaza finalizar cuando no existe emisión activa', () => {
      expect(
        () => finalizarEmision('programa-1'),
      ).toThrow(
        'La emisión ya no está activa.',
      )
    })

    it('rechaza finalizar un programa diferente al que está activo', () => {
      prepararEmision('programa-2')

      expect(
        () => finalizarEmision('programa-1'),
      ).toThrow(
        'La emisión ya no está activa.',
      )

      expect(
        obtenerEmision().programaId,
      ).toBe('programa-2')
    })

    it('impide al locutor finalizar un programa que no tiene asignado', () => {
      guardarSesion(locutor)
      prepararEmision('programa-2')

      expect(
        () => finalizarEmision('programa-2'),
      ).toThrow('Operación no permitida.')

      expect(
        obtenerEmision().programaId,
      ).toBe('programa-2')
    })

    it('impide al locutor finalizar la emisión si el programa ya no está en el catálogo', () => {
      guardarSesion(locutor)
      prepararEmision('programa-eliminado')

      expect(
        () =>
          finalizarEmision(
            'programa-eliminado',
          ),
      ).toThrow('Operación no permitida.')

      expect(
        obtenerEmision().programaId,
      ).toBe('programa-eliminado')
    })
  })
})