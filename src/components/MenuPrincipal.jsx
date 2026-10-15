import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

export default function MenuPrincipal({
  sesion,
  cerrarSesion,
}) {
  const [expandido, setExpandido] = useState(false)

  function cerrarMenu() {
    setExpandido(false)
  }

  return (
    <Navbar
      expand="lg"
      fixed="top"
      variant="dark"
      className="jugoseo-navbar"
      expanded={expandido}
      onToggle={setExpandido}
    >
      <Container>
        <Navbar.Brand
          as={NavLink}
          to="/app/inicio"
          className="jugoseo-brand"
          onClick={cerrarMenu}
        >
          JUGOSEO
          <span className="jugoseo-brand-dot">.com</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="navbarJugoseo"
          aria-label="Abrir menú"
        />

        <Navbar.Collapse id="navbarJugoseo">
          <Nav className="mx-auto mb-2 mb-lg-0 gap-lg-2">
            <Nav.Link
              as={NavLink}
              to="/app/inicio"
              onClick={cerrarMenu}
            >
              Inicio
            </Nav.Link>

            <Nav.Link disabled title="Pendiente de migración">
              Tienda
            </Nav.Link>

            <Nav.Link 
                as={NavLink}
                to="/app/noticias"
                onClick={cerrarMenu}
            >
              Noticias
            </Nav.Link>

            <Nav.Link
                as={NavLink}
                to="/app/programas"
                onClick={cerrarMenu}
            >
              Programas
            </Nav.Link>

            <Nav.Link 
                as={NavLink}
                to="/app/contacto"
                onClick={cerrarMenu}
            >
              Contacto
            </Nav.Link>

            {sesion.rol === 'Administrador' && (
              <Nav.Link disabled title="Pendiente de migración">
                Panel Admin
              </Nav.Link>
            )}

            {sesion.rol === 'Vendedor' && (
              <Nav.Link disabled title="Pendiente de migración">
                Panel Ventas
              </Nav.Link>
            )}
          </Nav>

          <div className="d-flex align-items-center gap-3">
            <span className="jugoseo-usuario-conectado d-none d-md-inline">
              Hola, {sesion.usuario}
            </span>

            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}