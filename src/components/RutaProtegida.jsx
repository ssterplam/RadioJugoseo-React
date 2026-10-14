import { Navigate, Outlet } from 'react-router-dom'

import { leerSesion } from '../data/sesion.js'

export default function RutaProtegida() {
  const sesion = leerSesion()

  if (!sesion) {
    return <Navigate to="/" replace />
  }

  return <Outlet context={{ sesion }} />
}