import { useState } from 'react'

import CarruselInicio from './CarruselInicio.jsx'
import LoginModal from './LoginModal.jsx'

export default function Portada() {
  const [mostrarLogin, setMostrarLogin] = useState(false)

  return (
    <>
      <header className="jugoseo-landing-header text-center">
        <div className="jugoseo-landing-logo">
          JUGOSEO
          <span className="jugoseo-brand-dot">.com</span>
        </div>

        <p className="jugoseo-landing-tagline">
          La radio online que suena sin parar
        </p>

        <button
          type="button"
          className="btn jugoseo-btn-login px-4"
          onClick={() => setMostrarLogin(true)}
        >
          Iniciar sesión
        </button>
      </header>

      <main className="container my-4 jugoseo-portada-contenido">
        <CarruselInicio />
      </main>

      <LoginModal
        mostrar={mostrarLogin}
        cerrar={() => setMostrarLogin(false)}
      />
    </>
  )
}