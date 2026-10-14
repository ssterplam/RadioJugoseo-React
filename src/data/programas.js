export const programas = [
  {
    id: 'dando-jugo',
    nombre: 'Dando Jugo',
    conductor: 'DJ Manu',
    horarioDetalle: 'Lunes a viernes · 20:00 a 22:00 hrs',
    imagen: 'DandoJugo.png',
    descripcion:
      'Programa liderado por DJ Manu de lunes a viernes. Aquí podrás encontrar sets de este dj, mezclas de música en vivo, animación y saludos al aire.',
    parrafos: [
      '"Dando Jugo" es el programa que cierra la tarde con la energía justa para la noche. DJ Manu combina sets en vivo con mezclas exclusivas, dando espacio a la animación y a los saludos de los oyentes que escriben durante la transmisión.',
      'Cada emisión incluye una selección distinta de música, por lo que ningún programa se repite. Si quieres que se mencione tu saludo al aire, puedes escribirnos por el chat en vivo durante el horario de transmisión.',
    ],
    caracteristicas: [
      'Sets de música en vivo mezclados por DJ Manu',
      'Segmentos de animación e interacción con la audiencia',
      'Saludos al aire para quienes participan en el chat',
    ],
  },
  {
    id: 'krrete-radial',
    nombre: 'Krrete Radial',
    conductor: 'NikoOnfire',
    horarioDetalle: 'Lunes a viernes · 17:00 a 19:00 hrs',
    imagen: 'carreteRadial.png',
    descripcion:
      'Programa radial liderado por NikoOnfire de lunes a viernes. Encontrarás premios, concursos, animación y espacio para mandar tus saludos.',
    parrafos: [
      '"Krrete Radial" es el espacio de la tarde conducido por NikoOnfire, pensado para acompañar la salida del trabajo o del estudio con concursos, premios y mucha interacción con la audiencia.',
      'Durante el programa se realizan dinámicas en vivo con premios para quienes participan, además de espacio para saludos y comentarios de los oyentes habituales.',
    ],
    caracteristicas: [
      'Concursos y premios en vivo',
      'Animación conducida por NikoOnfire',
      'Saludos y participación de la audiencia',
    ],
  },
  {
    id: 'prendiendo-la-noche',
    nombre: 'Prendiendo La Noche',
    conductor: 'Dj Ivan',
    horarioDetalle: 'Todos los días · 22:00 a 01:00 hrs',
    imagen: 'PrendiendoLaNoche.png',
    descripcion:
      'El cierre nocturno de Jugoseo: música electrónica y de fiesta sin cortes para acompañar tu noche, con mezclas continuas hasta la madrugada.',
    parrafos: [
      'El cierre nocturno de la radio. "Prendiendo La Noche" mantiene la fiesta encendida con mezclas continuas de música electrónica y de baile, ideal para quienes buscan seguir la noche activa.',
      'A diferencia de los demás programas, aquí la música no se detiene: es un bloque de mezcla continua pensado para sonar de fondo en juntas, previas o simplemente para acompañar la noche.',
    ],
    caracteristicas: [
      'Mezclas continuas de música electrónica',
      'Transmisión todos los días de la semana',
      'Ambiente pensado para la noche',
    ],
  },
  {
    id: 'tocando-bits',
    nombre: 'Tocando Bits',
    conductor: 'Dj Mikyx',
    horarioDetalle: 'Sábado y domingo · 11:00 a 14:00 hrs',
    imagen: 'TocandoBits.png',
    descripcion:
      'Un espacio más relajado para el fin de semana, con lo mejor de la música de la semana, entrevistas y recomendaciones de la comunidad.',
    parrafos: [
      'Un espacio más relajado para arrancar el sábado y el domingo, con lo mejor de la música de la semana, entrevistas y recomendaciones que llegan directo desde la comunidad de oyentes.',
      'Ideal para escuchar mientras se prepara el almuerzo o se planea el resto del fin de semana, con un ritmo más pausado que el resto de la programación.',
    ],
    caracteristicas: [
      'Resumen musical de la semana',
      'Entrevistas y recomendaciones',
      'Ritmo relajado, ideal para el fin de semana',
    ],
  },
]

export const programacionSemanal = [
  {
    horario: '11:00 - 14:00',
    semana: 'Mediodía musical',
    sabado: 'Fin de Semana Jugoso',
    domingo: 'Fin de Semana Jugoso',
  },
  {
    horario: '17:00 - 19:00',
    semana: 'Krrete Radial',
    sabado: 'Sesión acústica',
    domingo: 'Clásicos del recuerdo',
  },
  {
    horario: '20:00 - 22:00',
    semana: 'Dando Jugo',
    sabado: 'Previa del sábado',
    domingo: 'Cierre de semana',
  },
  {
    horario: '22:00 - 01:00',
    semana: 'Krrete Radial',
    sabado: 'Krrete Radial',
    domingo: 'Krrete Radial',
  },
]