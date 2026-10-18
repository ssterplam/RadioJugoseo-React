import { useState } from 'react'

import Carousel from 'react-bootstrap/Carousel'

const diapositivas = [
  {
    id: 'radio',
    clase: 'jugoseo-slide-1',
    etiqueta: 'Tu compañía online',
    titulo: 'Dale play a Jugoseo',
    texto:
      'Escucha la radio mientras recorres nuestros programas, ' +
      'noticias y comunidad.',
    imagen: 'DandoJugo.png',
    descripcionImagen: 'Imagen del programa Dando Jugo',
  },
  {
    id: 'tienda',
    clase: 'jugoseo-slide-2',
    etiqueta: 'Tienda oficial',
    titulo: 'Lleva Jugoseo contigo',
    texto:
      'Descubre poleras, tazas y entradas disponibles ' +
      'en nuestra tienda.',
    imagen: 'polera1.jpg',
    descripcionImagen: 'Polera de Radio Jugoseo',
  },
  {
    id: 'programas',
    clase: 'jugoseo-slide-3',
    etiqueta: 'Nuestra programación',
    titulo: 'Encuentra tu programa',
    texto:
      'Conoce a nuestros conductores y revisa los horarios ' +
      'de la programación semanal.',
    imagen: 'TocandoBits.png',
    descripcionImagen: 'Imagen del programa Tocando Bits',
  },
  {
    id: 'comunidad',
    clase: 'jugoseo-slide-4',
    etiqueta: 'Comunidad Jugoseo',
    titulo: 'Sé parte de la radio',
    texto:
      'Crea tu cuenta y participa en la experiencia ' +
      'de Radio Jugoseo.',
    imagen: 'carreteRadial.png',
    descripcionImagen: 'Imagen del programa Carrete Radial',
  },
]

export default function CarruselInicio() {
  const [pausado, setPausado] = useState(false)

  return (
    <section
      className="jugoseo-carrusel-visual"
      aria-label="Destacados de Radio Jugoseo"
    >
      <Carousel
        id="carruselJugoseo"
        className="jugoseo-carrusel"
        interval={pausado ? null : 5000}
        pause="hover"
        prevLabel="Anterior"
        nextLabel="Siguiente"
        indicatorLabels={diapositivas.map(
          (diapositiva) => diapositiva.titulo,
        )}
      >
        {diapositivas.map((diapositiva) => (
          <Carousel.Item key={diapositiva.id}>
            <div
              className={`jugoseo-slide ${diapositiva.clase}`}
            >
              <div className="jugoseo-slide-texto">
                <span className="jugoseo-slide-etiqueta">
                  {diapositiva.etiqueta}
                </span>

                <h2>{diapositiva.titulo}</h2>

                <p>{diapositiva.texto}</p>
              </div>

              <div className="jugoseo-slide-imagen">
                <img
                  src={
                    `${import.meta.env.BASE_URL}img/` +
                    diapositiva.imagen
                  }
                  alt={diapositiva.descripcionImagen}
                />
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>

      <div className="d-flex justify-content-end mt-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          onClick={() => setPausado((actual) => !actual)}
          aria-pressed={pausado}
        >
          {pausado
            ? 'Reanudar carrusel'
            : 'Pausar carrusel'}
        </button>
      </div>
    </section>
  )
}