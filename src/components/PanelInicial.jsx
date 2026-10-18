import { Link, useOutletContext } from 'react-router-dom'

/* Pantalla temporal para comprobar los accesos. 
* No presenta como terminadas las funciones pendientes.
 */
export default function PanelInicial({
  titulo,
  descripcion,
}) {
  const { sesion } = useOutletContext()

  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3">
          {titulo}
        </h1>

        <p>
          Hola, {sesion.usuario}.
        </p>

        <p className="jugoseo-card-texto">
          Rol actual: {sesion.rol}
        </p>

        <div className="alert alert-info" role="status">
          {descripcion}
        </div>

        <p className="jugoseo-card-texto">
          El acceso a este panel ya está conectado.
          Las herramientas de gestión se incorporarán
          en los siguientes bloques.
        </p>

        <Link
          to="/app/inicio"
          className="jugoseo-link"
        >
          ← Volver a Inicio
        </Link>
      </div>
    </section>
  )
}