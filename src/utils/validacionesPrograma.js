export function separarLineas(texto) {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
}

export function validarEdicionPrograma(
  datos,
  esAdministrador = false,
) {
  const errores = {}

  const reglas = [
    ['descripcion', 'La descripción', 500],
    ['imagen', 'La imagen', 150],
  ]

  if (esAdministrador) {
    reglas.push(
      ['nombre', 'El nombre', 100],
      ['conductor', 'El conductor', 100],
      ['horarioDetalle', 'El horario', 150],
    )
  }

  for (const [campo, etiqueta, maximo] of reglas) {
    const valor = datos[campo]

    if (typeof valor !== 'string' || !valor.trim()) {
      errores[campo] = `${etiqueta} es obligatorio.`
    } else if (valor.trim().length > maximo) {
      errores[campo] =
        `${etiqueta} no puede superar ${maximo} caracteres.`
    }
  }

  if (
    !errores.imagen &&
    !/^[\p{L}\p{N} _.-]+\.(png|jpe?g|webp|gif|avif)$/iu.test(
      datos.imagen.trim(),
    )
  ) {
    errores.imagen =
      'Ingresa solo el nombre de un archivo PNG, JPG, JPEG, WebP, GIF o AVIF.'
  }

  for (const campo of ['parrafos', 'caracteristicas']) {
    const texto = datos[campo]

    if (typeof texto !== 'string' || !texto.trim()) {
      errores[campo] = 'Ingresa al menos una línea de contenido.'
      continue
    }

    const lineas = separarLineas(texto)

    if (texto.length > 10000) {
      errores[campo] = 'El contenido no puede superar 10000 caracteres.'
    } else if (lineas.length > 20) {
      errores[campo] = 'Puedes ingresar un máximo de 20 líneas.'
    } else if (lineas.some((linea) => linea.length > 2000)) {
      errores[campo] =
        'Cada línea puede contener un máximo de 2000 caracteres.'
    }
  }

  return errores
}