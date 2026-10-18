import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  cargarCatalogoProgramas,
} from '../utils/programasStorage.js'

const rutaImagenes = `${import.meta.env.BASE_URL}img/`

export default function DetallePrograma() {
  const { programaId } = useParams()

  const [catalogo] = useState(cargarCatalogoProgramas)
  const { programas, error } = catalogo

  const programa = programas.find(
    (item) => item.id === programaId,
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [programaId])

  if (error) {
    return (
      <section className="pagina-interna">
        <div className="container">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>

          <Link
            to="/app/programas"
            className="jugoseo-link"
          >
            ← Volver a Programas
          </Link>
        </div>
      </section>
    )
  }

  if (!programa) {
    return (
      <section className="pagina-interna">
        <div className="container">
          <h1 className="pagina-titulo h3">
            Programa no encontrado
          </h1>

          <p className="jugoseo-card-texto">
            El programa solicitado no está disponible.
          </p>

          <Link
            to="/app/programas"
            className="jugoseo-link"
          >
            ← Volver a Programas
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="pagina-interna">
      <div
        className="container"
        style={{ maxWidth: 760 }}
      >
        <Link
          to="/app/programas"
          className="jugoseo-link d-inline-block mb-4"
        >
          ← Volver a Programas
        </Link>

        <img
          src={`${rutaImagenes}${programa.imagen}`}
          alt={programa.nombre}
          className="jugoseo-programa-detalle-img mb-4"
        />

        <span className="jugoseo-badge mb-2 d-inline-block">
          {programa.horarioDetalle}
        </span>

        <h1 className="pagina-titulo h3">
          {programa.nombre}
        </h1>

        <p className="jugoseo-card-texto mb-4">
          Con {programa.conductor}
        </p>

        {programa.parrafos.map((parrafo, indice) => (
          <p
            key={`${programa.id}-parrafo-${indice}`}
            style={{ color: 'var(--jugoseo-texto-claro)' }}
          >
            {parrafo}
          </p>
        ))}

        <h2 className="pagina-titulo h6 mt-4">
          Lo que puedes esperar
        </h2>

        <ul style={{ color: 'var(--jugoseo-texto-claro)' }}>
          {programa.caracteristicas.map((caracteristica) => (
            <li key={caracteristica}>
              {caracteristica}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}