import CarruselInicio from './CarruselInicio.jsx'

import { destacados } from '../data/destacados.js'

const rutaImagenes = `${import.meta.env.BASE_URL}img/`

export default function Inicio() {
  return (
    <>
      <header className="jugoseo-hero d-flex align-items-center justify-content-center text-center px-3">
        <div>
          <h1 className="jugoseo-hero-title display-5">
            JUGOSEO.COM
          </h1>

          <p
            className="jugoseo-texto-tenue"
            style={{ color: 'var(--jugoseo-texto-tenue)' }}
          >
            La radio online que suena sin parar, sección tras sección.
          </p>
        </div>
      </header>

      <section className="pagina-interna pt-4">
        <div className="container">
          <div className="mb-5">
            <CarruselInicio />
          </div>

          <h2 className="pagina-titulo h4 mt-5">
            Chat en vivo
          </h2>

          <p className="jugoseo-card-texto mb-4">
            Comenta con otros oyentes mientras escuchas la radio.
          </p>

          <div className="row justify-content-center">
            <div className="col-12 col-sm-12 col-md-9 col-lg-8 col-xl-8 col-xxl-6">
              <div className="jugoseo-chat-wrapper">
                <iframe
                  src="https://xat.com/embed/chat.php#id=220526323&gn=Jugoseo"
                  width="100%"
                  height="500"
                  scrolling="no"
                  title="Chat en vivo Jugoseo"
                  style={{ border: 0 }}
                />
              </div>
            </div>
          </div>

          <h2 className="pagina-titulo h4">
            Lo más destacado
          </h2>

          <div className="row g-4">
            {destacados.map((destacado) => (
              <div
                className="col-md-4"
                key={destacado.id}
              >
                <div className="jugoseo-card">
                  <img
                    src={`${rutaImagenes}${destacado.imagen}`}
                    alt={destacado.titulo}
                    className="jugoseo-card-img"
                  />

                  <span className="jugoseo-badge mb-2 d-inline-block">
                    {destacado.etiqueta}
                  </span>

                  <div className="jugoseo-card-titulo">
                    {destacado.titulo}
                  </div>

                  <p className="jugoseo-card-texto mt-2 mb-0">
                    {destacado.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}