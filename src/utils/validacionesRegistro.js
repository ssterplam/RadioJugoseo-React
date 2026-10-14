import { regionesComunas } from '../data/regionesComunas.js'

export function validarRun(runIngresado) {
  const run = runIngresado.trim().toUpperCase()

  if (!run) {
    return 'El RUN es obligatorio.'
  }

  if (/[.\-]/.test(run)) {
    return 'El RUN no debe llevar puntos ni guion.'
  }

  if (run.length < 7 || run.length > 9) {
    return 'El RUN debe tener entre 7 y 9 caracteres.'
  }

  if (!/^[0-9]+[0-9K]$/.test(run)) {
    return 'El RUN debe contener números y un dígito verificador válido.'
  }

  const cuerpo = run.slice(0, -1)
  const digito = run.slice(-1)

  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resultado = 11 - (suma % 11)

  const esperado =
    resultado === 11
      ? '0'
      : resultado === 10
        ? 'K'
        : String(resultado)

  if (digito !== esperado) {
    return 'El RUN ingresado tiene un dígito verificador incorrecto.'
  }

  return ''
}

function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false
  }

  const fecha = new Date(`${valor}T00:00:00Z`)

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  )
}

export function validarRegistro(datos) {
  const errores = {}

  const nombre = datos.nombre.trim()
  const apellido = datos.apellido.trim()
  const correo = datos.correo.trim().toLowerCase()

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio.'
  } else if (nombre.length > 50) {
    errores.nombre = 'El nombre no puede superar 50 caracteres.'
  }

  if (!apellido) {
    errores.apellido = 'El apellido es obligatorio.'
  } else if (apellido.length > 100) {
    errores.apellido = 'El apellido no puede superar 100 caracteres.'
  }

  const dominios = [
    '@duoc.cl',
    '@profesor.duoc.cl',
    '@gmail.com',
  ]

  if (!correo) {
    errores.correo = 'El correo es obligatorio.'
  } else if (correo.length > 100) {
    errores.correo = 'El correo no puede superar 100 caracteres.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = 'Ingresa un correo con formato válido.'
  } else if (!dominios.some((dominio) => correo.endsWith(dominio))) {
    errores.correo =
      'El correo debe pertenecer a @duoc.cl, @profesor.duoc.cl o @gmail.com.'
  }

  const errorRun = validarRun(datos.run)

  if (errorRun) {
    errores.run = errorRun
  }

  if (!datos.password) {
    errores.password = 'La contraseña es obligatoria.'
  } else if (datos.password.length < 4 || datos.password.length > 10) {
    errores.password = 'La contraseña debe tener entre 4 y 10 caracteres.'
  }

  if (!datos.passwordConfirm) {
    errores.passwordConfirm = 'Confirma tu contraseña.'
  } else if (datos.passwordConfirm !== datos.password) {
    errores.passwordConfirm = 'Las contraseñas no coinciden.'
  }

  if (
    datos.fechaNacimiento &&
    !fechaValida(datos.fechaNacimiento)
  ) {
    errores.fechaNacimiento = 'Ingresa una fecha válida.'
  }

  if (datos.direccion.trim().length > 300) {
    errores.direccion = 'La dirección no puede superar 300 caracteres.'
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      regionesComunas,
      datos.region,
    )
  ) {
    errores.region = 'Selecciona tu región.'
  }

  const comunasPermitidas = regionesComunas[datos.region] || []

  if (!comunasPermitidas.includes(datos.comuna)) {
    errores.comuna = 'Selecciona una comuna de la región elegida.'
  }

  if (!['Socio VIP', 'Radioescucha Oficial'].includes(datos.tipo)) {
    errores.tipo = 'Selecciona un tipo de registro.'
  }

  return errores
}