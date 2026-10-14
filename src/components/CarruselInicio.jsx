import Carousel from 'react-bootstrap/Carousel'

const diapositivas = [
  {
    clase: 'jugoseo-slide-1',
    titulo: 'Bienvenido a Jugoseo',
    texto: 'La radio online que suena sin parar, sección tras sección.',
  },
  {
    clase: 'jugoseo-slide-2',
    titulo: 'Nueva línea de merch',
    texto: 'Poleras, tazas y más en nuestra tienda oficial.',
  },
  {
    clase: 'jugoseo-slide-3',
    titulo: 'Programas todos los días',
    texto: 'Conoce a nuestros conductores y la parrilla completa.',
  },
  {
    clase: 'jugoseo-slide-4',
    titulo: 'Únete como Socio VIP',
    texto: 'Regístrate y accede a beneficios exclusivos.',
  },
]

export default function CarruselInicio() {
  return (
    <Carousel
      id="carruselJugoseo"
      className="jugoseo-carrusel"
      interval={5000}
      pause="hover"
      prevLabel="Anterior"
      nextLabel="Siguiente"
    >
      {diapositivas.map((diapositiva) => (
        <Carousel.Item key={diapositiva.clase}>
          <div className={`jugoseo-slide ${diapositiva.clase}`}>
            <div className="jugoseo-slide-texto">
              <h2>{diapositiva.titulo}</h2>
              <p>{diapositiva.texto}</p>
            </div>
          </div>
        </Carousel.Item>
      ))}
    </Carousel>
  )
}