import { useState } from 'react'
import {
  Outlet,
  useNavigate,
  useOutletContext,
} from 'react-router-dom'

import MenuPrincipal from './MenuPrincipal.jsx'
import { eliminarSesion } from '../data/sesion.js'

export default function AplicacionInterna() {
  const { sesion } = useOutletContext()
  const navigate = useNavigate()

  const [errorSesion, setErrorSesion] = useState('')

  function cerrarSesion() {
    const eliminada = eliminarSesion()

    if (!eliminada) {
      setErrorSesion(
        'No se pudo eliminar la sesión. Revisa el almacenamiento del navegador.',
      )
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="jugoseo-interna">
      <MenuPrincipal
        sesion={sesion}
        cerrarSesion={cerrarSesion}
      />

      <main className="jugoseo-interna-contenido">
        {errorSesion && (
          <div className="container pt-3">
            <div className="alert alert-danger" role="alert">
              {errorSesion}
            </div>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  )
}