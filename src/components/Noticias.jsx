import { Link } from 'react-router-dom'

import { noticias } from '../data/noticias.js'

export default function Noticias() {
  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3 mb-1">
          Noticias
        </h1>

        <p
          className="mb-4"
          style={{ color: 'var(--jugoseo-texto-tenue)' }}
        >
          Todo lo que pasa dentro y fuera de la radio.
        </p>

        <div className="row g-4">
          {noticias.length === 0 ? (
            <p className="jugoseo-card-texto">
              No hay noticias disponibles por el momento.
            </p>
          ) : (
            noticias.map((noticia) => (
              <div
                className="col-md-6"
                key={noticia.id}
              >
                <article className="jugoseo-card d-flex flex-column h-100">
                  <span className="jugoseo-badge mb-2 d-inline-block">
                    {noticia.categoria}
                  </span>

                  <h2 className="jugoseo-card-titulo mb-0">
                    {noticia.titulo}
                  </h2>

                  <p className="jugoseo-card-texto mt-2 mb-1">
                    {noticia.resumen}
                  </p>

                  <small className="jugoseo-card-texto mb-3">
                    {noticia.fecha}
                  </small>

                  <Link
                    to={`/app/noticias/${noticia.id}`}
                    className="btn jugoseo-btn-login mt-auto align-self-start px-3"
                  >
                    Leer más
                  </Link>
                </article>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}