import {
  NavLink,
  Outlet,
  useOutletContext,
} from 'react-router-dom'

export default function PanelAdmin() {
  const { sesion } = useOutletContext()

  return (
    <div>
      <header className="container pt-4">
        <h1 className="pagina-titulo h3 mb-2">
          Panel Administrador
        </h1>

        <p className="jugoseo-card-texto mb-4">
          Gestión de la radio y sus servicios.
        </p>

        <nav
          className="d-flex flex-wrap gap-2 pb-4 border-bottom"
          aria-label="Secciones de administración"
        >
          <NavLink
            to="/app/admin/programas"
            className={({ isActive }) =>
              `btn ${
                isActive
                  ? 'jugoseo-btn-login'
                  : 'btn-outline-light'
              }`
            }
          >
            Programas
          </NavLink>

          <button
            type="button"
            className="btn btn-outline-light"
            disabled
            title="Pendiente de implementación"
          >
            Productos
          </button>

          <button
            type="button"
            className="btn btn-outline-light"
            disabled
            title="Pendiente de implementación"
          >
            Usuarios
          </button>

          <button
            type="button"
            className="btn btn-outline-light"
            disabled
            title="Pendiente de implementación"
          >
            Pedidos
          </button>
        </nav>
      </header>

      <Outlet context={{ sesion }} />
    </div>
  )
}