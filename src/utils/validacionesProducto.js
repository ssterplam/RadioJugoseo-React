import { CATEGORIAS_VALIDAS } from '../data/productos.js'

export function validarProducto(
  datos,
  productos = [],
  idExcluir = null,
) {
  const errores = {}

  const codigo =
    typeof datos.codigo === 'string'
      ? datos.codigo.trim().toUpperCase()
      : ''

  const nombre =
    typeof datos.nombre === 'string'
      ? datos.nombre.trim()
      : ''

  const descripcion =
    typeof datos.descripcion === 'string'
      ? datos.descripcion.trim()
      : ''

  const imagen =
    typeof datos.imagen === 'string'
      ? datos.imagen.trim()
      : ''

  if (codigo.length < 3 || codigo.length > 30) {
    errores.codigo = 'El código debe tener entre 3 y 30 caracteres.'
  } else if (
    productos.some(
      (producto) =>
        producto.id !== idExcluir &&
        String(producto.codigo || '').trim().toUpperCase() === codigo,
    )
  ) {
    errores.codigo = 'Ya existe un producto con ese código.'
  }

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio.'
  } else if (nombre.length > 100) {
    errores.nombre = 'El nombre no puede superar 100 caracteres.'
  }

  if (descripcion.length > 500) {
    errores.descripcion =
      'La descripción no puede superar 500 caracteres.'
  }

  if (!CATEGORIAS_VALIDAS.includes(datos.categoria)) {
    errores.categoria = 'Selecciona una categoría válida.'
  }

  for (const campo of ['precio', 'stock']) {
    const valor = datos[campo]
    const tipoValido =
      typeof valor === 'string' || typeof valor === 'number'

    const texto = tipoValido ? String(valor).trim() : ''
    const numero = Number(texto)

    if (
      !texto ||
      !Number.isSafeInteger(numero) ||
      numero < 0
    ) {
      errores[campo] =
        'Ingresa un número entero mayor o igual a cero.'
    }
  }

  if (!imagen) {
    errores.imagen = 'La imagen es obligatoria.'
  } else if (
    imagen.length > 150 ||
    !/^[\p{L}\p{N} _.-]+\.(png|jpe?g|webp|gif|avif)$/iu.test(imagen)
  ) {
    errores.imagen =
      'Ingresa solo el nombre de un archivo PNG, JPG, JPEG, WebP, GIF o AVIF.'
  }

  return errores
}