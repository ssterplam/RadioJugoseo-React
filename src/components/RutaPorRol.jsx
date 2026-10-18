import { Navigate, Outlet } from 'react-router-dom'

import { leerSesion } from '../data/sesion.js'

export default function RutaPorRol({ permitidos }) {
  const sesion = leerSesion()

  if (!sesion) {
    return <Navigate to="/" replace />
  }

  if (!permitidos.includes(sesion.rol)) {
    return <Navigate to="/app/inicio" replace />
  }

  return <Outlet context={{ sesion }} />
}

/* 
* Sin sesión: vuelve a la portada.
* Con sesión, pero sin el rol requerido: vuelve a Inicio.
* Con permiso: muestra el panel.
*/