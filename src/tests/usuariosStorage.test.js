import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

vi.mock('../utils/programasStorage.js', () => ({
  obtenerProgramas: vi.fn(() => []),
}))

import {
  actualizarUsuario,
  crearUsuarioInterno,
  eliminarUsuario,
  obtenerUsuariosAdministrables,
} from '../utils/usuariosStorage.js'

import {
  CLAVE_USUARIOS,
  EVENTO_USUARIOS,
} from '../utils/cuentasLectura.js'

import {
  usuariosDemo,
} from '../data/usuariosDemo.js'

import {
  CLAVE_EMISION,
} from '../utils/emisionStorage.js'

import {
  obtenerProgramas,
} from '../utils/programasStorage.js'

const administradorDemo = usuariosDemo.find(
  (usuario) => usuario.rol === 'Administrador',
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

function datosCreacion(cambios = {}) {
  return {
    nombre: 'Pedro',
    apellido: 'Soto',
    correo: 'pedro.locutor@jugoseo.com',
    rol: 'Locutor',
    password: 'clave',
    passwordConfirm: 'clave',
    ...cambios,
  }
}

function datosEdicion(cambios = {}) {
  return {
    nombre: 'Ana Actualizada',
    apellido: 'Pérez Actualizada',
    rol: 'Locutor',
    tipo: null,
    password: '',
    passwordConfirm: '',
    ...cambios,
  }
}

function guardarSesion(
  correo = administradorDemo.correo,
) {
  sessionStorage.setItem(
    'jugoseoUsuario',
    JSON.stringify({
      correo,
      rol: 'Administrador',
    }),
  )
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(usuarios),
  )
}

function leerUsuarios() {
  return JSON.parse(
    localStorage.getItem(CLAVE_USUARIOS),
  )
}

function prepararEmision(iniciadaPor = null) {
  if (iniciadaPor === null) {
    localStorage.removeItem(CLAVE_EMISION)
    return
  }

  localStorage.setItem(
    CLAVE_EMISION,
    JSON.stringify({
      programaId: 'programa-1',
      iniciadaPor,
      inicio: '2026-10-18T10:00:00.000Z',
    }),
  )
}

function obtenerCodigoError(accion) {
  try {
    accion()
  } catch (error) {
    return error.codigo
  }

  throw new Error(
    'La operación debía ser rechazada.',
  )
}

describe('usuariosStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()

    guardarSesion()
    guardarUsuarios([])
    prepararEmision()

    vi.spyOn(
      window,
      'dispatchEvent',
    ).mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()

    localStorage.clear()
    sessionStorage.clear()
  })

  it('rechaza consultar usuarios sin sesión de administrador', () => {
    sessionStorage.clear()

    expect(
      () => obtenerUsuariosAdministrables(),
    ).toThrow('Operación no permitida.')
  })

  it('combina cuentas demo y locales, normaliza correos y marca revisiones', () => {
    guardarUsuarios([
      usuarioLocal(),
      usuarioLocal({
        id: 'usuario-local-2',
        nombre: 'Pedro',
        apellido: '',
        correo: 'pedro@correo.com',
        rol: 'Locutor',
        tipo: null,
        fechaCreacion: null,
      }),
    ])

    const usuarios =
      obtenerUsuariosAdministrables()

    expect(usuarios).toHaveLength(
      usuariosDemo.length + 2,
    )

    const ana = usuarios.find(
      (usuario) =>
        usuario.correo ===
        'ana.locutora@jugoseo.com',
    )

    const pedro = usuarios.find(
      (usuario) =>
        usuario.correo === 'pedro@correo.com',
    )

    expect(ana).toEqual({
      correo: 'ana.locutora@jugoseo.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'Locutor',
      tipo: null,
      fechaCreacion:
        '2026-01-01T10:00:00.000Z',
      origen: 'Local',
      requiereRevision: false,
    })

    expect(pedro).toEqual({
      correo: 'pedro@correo.com',
      nombre: 'Pedro',
      apellido: '',
      rol: 'Locutor',
      tipo: null,
      fechaCreacion: null,
      origen: 'Local',
      requiereRevision: true,
    })
  })

  it('crea un locutor local, emite el evento y conserva las cuentas demo', () => {
    const resultado = crearUsuarioInterno(
      datosCreacion({
        correo: '  PEDRO.LOCUTOR@jugoseo.com  ',
      }),
    )

    const creado = resultado.find(
      (usuario) =>
        usuario.correo ===
        'pedro.locutor@jugoseo.com',
    )

    expect(creado).toEqual({
      correo: 'pedro.locutor@jugoseo.com',
      nombre: 'Pedro',
      apellido: 'Soto',
      rol: 'Locutor',
      tipo: null,
      fechaCreacion: expect.any(String),
      origen: 'Local',
      requiereRevision: false,
    })

    expect(leerUsuarios()).toHaveLength(1)

    expect(
      leerUsuarios()[0].id,
    ).toMatch(/^usuario-/)

    expect(
      leerUsuarios()[0].versionCuenta,
    ).toBe(0)

    expect(
      window.dispatchEvent,
    ).toHaveBeenCalledWith(
      new Event(EVENTO_USUARIOS),
    )

    expect(resultado).toHaveLength(
      usuariosDemo.length + 1,
    )
  })

  it('rechaza crear un usuario con datos inválidos', () => {
    const inicial = localStorage.getItem(
      CLAVE_USUARIOS,
    )

    expect(
      () =>
        crearUsuarioInterno(
          datosCreacion({
            passwordConfirm: 'otra',
          }),
        ),
    ).toThrow(
      'Los datos ingresados no son válidos.',
    )

    expect(
      localStorage.getItem(CLAVE_USUARIOS),
    ).toBe(inicial)
  })

  it('rechaza actualizar una cuenta demo o una cuenta inexistente', () => {
    expect(
      obtenerCodigoError(() =>
        actualizarUsuario(
          administradorDemo.correo,
          datosEdicion(),
        ),
      ),
    ).toBe('CUENTA_PROTEGIDA')

    expect(
      obtenerCodigoError(() =>
        actualizarUsuario(
          'inexistente@jugoseo.com',
          datosEdicion(),
        ),
      ),
    ).toBe('CUENTA_NO_DISPONIBLE')
  })

  it('actualiza una cuenta local y aumenta su versión', () => {
    guardarUsuarios([usuarioLocal()])

    const resultado = actualizarUsuario(
      'ana.locutora@jugoseo.com',
      datosEdicion(),
    )

    const actualizada = resultado.find(
      (usuario) =>
        usuario.correo ===
        'ana.locutora@jugoseo.com',
    )

    expect(actualizada).toEqual({
      correo: 'ana.locutora@jugoseo.com',
      nombre: 'Ana Actualizada',
      apellido: 'Pérez Actualizada',
      rol: 'Locutor',
      tipo: null,
      fechaCreacion:
        '2026-01-01T10:00:00.000Z',
      origen: 'Local',
      requiereRevision: false,
    })

    expect(leerUsuarios()[0]).toEqual({
      ...usuarioLocal(),
      nombre: 'Ana Actualizada',
      apellido: 'Pérez Actualizada',
      rol: 'Locutor',
      tipo: null,
      password: 'clave',
      versionCuenta: 1,
    })

    expect(
      window.dispatchEvent,
    ).toHaveBeenCalledWith(
      new Event(EVENTO_USUARIOS),
    )
  })

  it('conserva la contraseña anterior cuando la edición no incluye una nueva', () => {
    guardarUsuarios([usuarioLocal()])

    actualizarUsuario(
      'ana.locutora@jugoseo.com',
      datosEdicion(),
    )

    expect(
      leerUsuarios()[0].password,
    ).toBe('clave')
  })

  it('actualiza un cliente conservando su rol y tipo válido', () => {
    guardarUsuarios([
      usuarioLocal({
        correo: 'ana.perez@duocuc.cl',
        rol: 'Cliente',
        tipo: 'Socio VIP',
      }),
    ])

    const resultado = actualizarUsuario(
      'ana.perez@duocuc.cl',
      datosEdicion({
        rol: 'Cliente',
        tipo: 'Radioescucha Oficial',
      }),
    )

    const actualizada = resultado.find(
      (usuario) =>
        usuario.correo ===
        'ana.perez@duocuc.cl',
    )

    expect(actualizada.rol).toBe('Cliente')
    expect(actualizada.tipo).toBe(
      'Radioescucha Oficial',
    )

    expect(
      leerUsuarios()[0].versionCuenta,
    ).toBe(1)
  })

  it('impide cambiar el rol de un locutor con emisión activa', () => {
    guardarUsuarios([usuarioLocal()])
    prepararEmision(
      'ana.locutora@jugoseo.com',
    )

    expect(
      obtenerCodigoError(() =>
        actualizarUsuario(
          'ana.locutora@jugoseo.com',
          datosEdicion({
            rol: 'Administrador',
          }),
        ),
      ),
    ).toBe('EMISION_ACTIVA')
  })

  it('impide cambiar el rol de un locutor asignado a un programa', () => {
    guardarUsuarios([usuarioLocal()])

    obtenerProgramas.mockReturnValueOnce([{
      locutorCorreo:
        'ana.locutora@jugoseo.com',
    }])

    expect(
      obtenerCodigoError(() =>
        actualizarUsuario(
          'ana.locutora@jugoseo.com',
          datosEdicion({
            rol: 'Administrador',
          }),
        ),
      ),
    ).toBe('USUARIO_ASIGNADO')
  })

  it('rechaza una edición con datos inválidos', () => {
    guardarUsuarios([usuarioLocal()])

    expect(
      obtenerCodigoError(() =>
        actualizarUsuario(
          'ana.locutora@jugoseo.com',
          datosEdicion({
            nombre: '',
          }),
        ),
      ),
    ).toBe('DATOS_INVALIDOS')
  })

  it('elimina una cuenta local sin vínculos y emite el evento', () => {
    guardarUsuarios([
      usuarioLocal(),
      usuarioLocal({
        id: 'usuario-local-2',
        correo: 'pedro.locutor@jugoseo.com',
      }),
    ])

    const resultado = eliminarUsuario(
      'ana.locutora@jugoseo.com',
    )

    expect(resultado).toHaveLength(
      usuariosDemo.length + 1,
    )

    expect(
      resultado.some(
        (usuario) =>
          usuario.correo ===
          'ana.locutora@jugoseo.com',
      ),
    ).toBe(false)

    expect(leerUsuarios()).toHaveLength(1)

    expect(
      window.dispatchEvent,
    ).toHaveBeenCalledWith(
      new Event(EVENTO_USUARIOS),
    )
  })

  it('impide eliminar una cuenta con emisión activa o asignada a un programa', () => {
    guardarUsuarios([usuarioLocal()])
    prepararEmision(
      'ana.locutora@jugoseo.com',
    )

    expect(
      obtenerCodigoError(() =>
        eliminarUsuario(
          'ana.locutora@jugoseo.com',
        ),
      ),
    ).toBe('EMISION_ACTIVA')

    guardarUsuarios([usuarioLocal()])
    prepararEmision()

    obtenerProgramas.mockReturnValueOnce([{
      locutorCorreo:
        'ana.locutora@jugoseo.com',
    }])

    expect(
      obtenerCodigoError(() =>
        eliminarUsuario(
          'ana.locutora@jugoseo.com',
        ),
      ),
    ).toBe('USUARIO_ASIGNADO')
  })
})