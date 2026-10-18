import { useEffect, useReducer } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { leerSesion } from '../data/sesion.js'

import {
  CLAVE_USUARIOS,
  EVENTO_USUARIOS,
} from '../utils/cuentasLectura.js'

export default function RutaProtegida() {
  const [, actualizar] = useReducer(
    (valor) => valor + 1,
    0,
  )

  useEffect(() => {
    function revisarAlmacenamiento(evento) {
      if (
        evento.key === CLAVE_USUARIOS ||
        evento.key === null
      ) {
        actualizar()
      }
    }

    window.addEventListener(EVENTO_USUARIOS, actualizar)
    window.addEventListener('focus', actualizar)
    window.addEventListener('storage', revisarAlmacenamiento)

    return () => {
      window.removeEventListener(EVENTO_USUARIOS, actualizar)
      window.removeEventListener('focus', actualizar)
      window.removeEventListener(
        'storage',
        revisarAlmacenamiento,
      )
    }
  }, [])

  const sesion = leerSesion()

  if (!sesion) {
    return <Navigate to="/" replace />
  }

  return <Outlet context={{ sesion }} />
}