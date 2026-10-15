import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { noticias } from '../data/noticias.js'

export default function DetalleNoticia() {
  const { noticiaId } = useParams()

  const noticia = noticias.find(
    (item) => item.id === noticiaId,
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [noticiaId])

  if (!noticia) {
    return (
      <section className="pagina-interna">
        <div className="container">
          <h1 className="pagina-titulo h3">
            Noticia no encontrada
          </h1>

          <p className="jugoseo-card-texto">
            La noticia solicitada no está disponible.
          </p>

          <Link
            to="/app/noticias"
            className="jugoseo-link"
          >
            ← Volver a Noticias
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="pagina-interna">
      <article
        className="container"
        style={{ maxWidth: 720 }}
      >
        <Link
          to="/app/noticias"
          className="jugoseo-link d-inline-block mb-4"
        >
          ← Volver a Noticias
        </Link>

        <div
          className="jugoseo-card-img mb-4"
          style={{ height: 200 }}
          aria-hidden="true"
        />

        <span className="jugoseo-badge mb-2 d-inline-block">
          {noticia.categoria}
        </span>

        <h1 className="pagina-titulo h3">
          {noticia.titulo}
        </h1>

        <p className="jugoseo-card-texto mb-4">
          {noticia.fecha}
        </p>

        {noticia.parrafos.map((parrafo, indice) => (
          <p
            key={`${noticia.id}-parrafo-${indice}`}
            style={{ color: 'var(--jugoseo-texto-claro)' }}
          >
            {parrafo}
          </p>
        ))}
      </article>
    </section>
  )
}