import { Link } from 'react-router-dom'

import {
  programas,
  programacionSemanal,
} from '../data/programas.js'

const rutaImagenes = `${import.meta.env.BASE_URL}img/`

export default function Programas() {
  return (
    <section className="pagina-interna">
      <div className="container">
        <h1 className="pagina-titulo h3 mb-1">
          Programas
        </h1>

        <p
          className="mb-4"
          style={{ color: 'var(--jugoseo-texto-tenue)' }}
        >
          Conoce a los conductores y horarios de Jugoseo.
        </p>

        <div className="row g-4 mb-5">
          {programas.length === 0 ? (
            <p className="jugoseo-card-texto">
              No hay programas disponibles por el momento.
            </p>
          ) : (
            programas.map((programa) => (
              <div
                className="col-sm-6 col-lg-3"
                key={programa.id}
              >
                <div className="jugoseo-card d-flex flex-column h-100">
                  <img
                    src={`${rutaImagenes}${programa.imagen}`}
                    alt={programa.nombre}
                    className="jugoseo-card-img"
                    loading="lazy"
                    onError={(evento) => {
                      evento.currentTarget.style.display = 'none'
                    }}
                  />

                  <div className="jugoseo-card-titulo mb-1">
                    {programa.nombre}
                  </div>

                  <p className="jugoseo-card-texto mb-3">
                    {programa.descripcion}
                  </p>

                  <Link
                    to={`/app/programas/${programa.id}`}
                    className="btn jugoseo-btn-login mt-auto"
                  >
                    Ir al Programa
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <h2 className="pagina-titulo h5 mb-3">
          Programación semanal
        </h2>

        <div className="table-responsive">
          <table className="table jugoseo-tabla-programas align-middle">
            <thead>
              <tr>
                <th scope="col">Horario</th>
                <th scope="col">Lunes a viernes</th>
                <th scope="col">Sábado</th>
                <th scope="col">Domingo</th>
              </tr>
            </thead>

            <tbody>
              {programacionSemanal.map((fila) => (
                <tr key={fila.horario}>
                  <td>{fila.horario}</td>
                  <td>{fila.semana}</td>
                  <td>{fila.sabado}</td>
                  <td>{fila.domingo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}