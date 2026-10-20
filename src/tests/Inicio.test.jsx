import {
  render,
  screen,
  within,
} from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import Inicio from '../components/Inicio.jsx'

import { destacados } from '../data/destacados.js'

vi.mock('../components/CarruselInicio.jsx', () => ({
  default: function CarruselSimulado() {
    return (
      <section aria-label="Carrusel de prueba">
        Contenido del carrusel
      </section>
    )
  },
}))

describe('Inicio', () => {
  it('muestra el encabezado, las secciones y el carrusel', () => {
    render(<Inicio />)

    expect(
      screen.getByRole('heading', {
        name: 'JUGOSEO.COM',
        level: 1,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'La radio online que suena sin parar, sección tras sección.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('region', {
        name: 'Carrusel de prueba',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Chat en vivo',
        level: 2,
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Lo más destacado',
        level: 2,
        exact: true,
      }),
    ).toBeInTheDocument()
  })

  it('incluye el iframe del chat con su título y dirección configurados', () => {
    render(<Inicio />)

    expect(
      screen.getByText(
        'Comenta con otros oyentes mientras escuchas la radio.',
      ),
    ).toBeInTheDocument()

    const chat = screen.getByTitle(
      'Chat en vivo Jugoseo',
      { exact: true },
    )

    expect(chat.tagName).toBe('IFRAME')

    expect(chat).toHaveAttribute(
      'src',
      'https://xat.com/embed/chat.php#id=220526323&gn=Jugoseo',
    )

    expect(chat).toHaveAttribute('width', '100%')
    expect(chat).toHaveAttribute('height', '500')
  })

  it('renderiza todos los destacados con sus imágenes y datos', () => {
    render(<Inicio />)

    expect(destacados.length).toBeGreaterThan(0)

    expect(
      screen.getAllByRole('img'),
    ).toHaveLength(destacados.length)

    for (const destacado of destacados) {
      const imagen = screen.getByRole('img', {
        name: destacado.titulo,
        exact: true,
      })

      expect(imagen).toHaveAttribute(
        'src',
        `${import.meta.env.BASE_URL}img/${destacado.imagen}`,
      )

      const tarjeta = imagen.closest(
        '.jugoseo-card',
      )

      expect(tarjeta).toBeInTheDocument()

      const contenido = within(tarjeta)

      expect(
        contenido.getByText(destacado.titulo, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        contenido.getByText(destacado.etiqueta, {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        contenido.getByText(
          destacado.descripcion,
          { exact: true },
        ),
      ).toBeInTheDocument()
    }
  })
})